'use client'

import { useState, useRef, useEffect } from 'react'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatUIProps {
  messages: Message[]
  streaming: boolean
  streamingContent: string
  onSend: (text: string) => void
  placeholder?: string
  compact?: boolean
  noKeyConfigured?: boolean
}

// Simple markdown renderer — bold, italic, headers, lists, code
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // H3
    if (line.startsWith('### ')) {
      nodes.push(<div key={i} style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-1)', marginTop: '10px', marginBottom: '2px' }}>{line.slice(4)}</div>)
    // H2
    } else if (line.startsWith('## ')) {
      nodes.push(<div key={i} style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-1)', marginTop: '12px', marginBottom: '4px' }}>{line.slice(3)}</div>)
    // H1
    } else if (line.startsWith('# ')) {
      nodes.push(<div key={i} style={{ fontWeight: 800, fontSize: '16px', color: 'var(--color-text-1)', marginTop: '14px', marginBottom: '4px' }}>{line.slice(2)}</div>)
    // Bullet
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      nodes.push(
        <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '2px' }}>
          <span style={{ color: 'var(--color-brand)', flexShrink: 0, marginTop: '1px' }}>▸</span>
          <span>{inlineMarkdown(line.slice(2))}</span>
        </div>
      )
    // Numbered list
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)$/)
      if (match) {
        nodes.push(
          <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '2px' }}>
            <span style={{ color: 'var(--color-brand)', flexShrink: 0, minWidth: '18px' }}>{match[1]}.</span>
            <span>{inlineMarkdown(match[2])}</span>
          </div>
        )
      }
    // Code block
    } else if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      nodes.push(
        <pre key={i} style={{
          background: 'var(--color-surface-2)', border: '0.5px solid var(--color-border)',
          borderRadius: '6px', padding: '8px 10px', fontSize: '12px',
          overflowX: 'auto', margin: '6px 0', fontFamily: 'monospace',
          color: 'var(--color-text-1)',
        }}>
          {codeLines.join('\n')}
        </pre>
      )
    // Horizontal rule
    } else if (line === '---' || line === '***') {
      nodes.push(<hr key={i} style={{ border: 'none', borderTop: '0.5px solid var(--color-border)', margin: '8px 0' }} />)
    // Empty line → spacer
    } else if (line.trim() === '') {
      nodes.push(<div key={i} style={{ height: '6px' }} />)
    // Normal text
    } else {
      nodes.push(<div key={i} style={{ lineHeight: 1.55 }}>{inlineMarkdown(line)}</div>)
    }

    i++
  }

  return nodes
}

function inlineMarkdown(text: string): React.ReactNode {
  // Bold + italic
  const parts = text.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('***') && part.endsWith('***')) return <strong key={i}><em>{part.slice(3, -3)}</em></strong>
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} style={{ color: 'var(--color-text-1)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} style={{ background: 'var(--color-surface-2)', padding: '1px 4px', borderRadius: '3px', fontSize: '0.9em', fontFamily: 'monospace' }}>{part.slice(1, -1)}</code>
    return part
  })
}

export function ChatUI({ messages, streaming, streamingContent, onSend, placeholder, compact, noKeyConfigured }: ChatUIProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')
    onSend(text)
  }

  const msgFontSize = compact ? '13px' : '14px'
  const inputFontSize = compact ? '13px' : '14px'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: compact ? '12px' : '16px 20px',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        {noKeyConfigured && (
          <div style={{
            padding: '12px 14px', borderRadius: '10px',
            background: 'var(--color-surface-2)',
            border: '0.5px solid var(--color-border)',
            fontSize: '13px', color: 'var(--color-text-2)', lineHeight: 1.5,
          }}>
            To activate your AI coach, add your Anthropic API key in{' '}
            <a href="/settings?tab=connections" style={{ color: 'var(--color-brand)', textDecoration: 'none', fontWeight: 500 }}>
              Settings → Connections
            </a>.
            {' '}Your key is stored privately and never shared.
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'var(--color-brand)', color: '#fff',
                fontSize: '11px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginRight: '8px', marginTop: '2px',
              }}>
                B
              </div>
            )}
            <div style={{
              maxWidth: compact ? '88%' : '75%',
              padding: compact ? '8px 11px' : '10px 14px',
              borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
              background: msg.role === 'user' ? 'var(--color-brand)' : 'var(--color-surface-2)',
              color: msg.role === 'user' ? '#fff' : 'var(--color-text-1)',
              fontSize: msgFontSize,
              lineHeight: 1.5,
              border: msg.role === 'assistant' ? '0.5px solid var(--color-border)' : 'none',
            }}>
              {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
            </div>
          </div>
        ))}

        {streaming && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'var(--color-brand)', color: '#fff',
              fontSize: '11px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginRight: '8px', marginTop: '2px',
            }}>
              B
            </div>
            <div style={{
              maxWidth: compact ? '88%' : '75%',
              padding: compact ? '8px 11px' : '10px 14px',
              borderRadius: '12px 12px 12px 4px',
              background: 'var(--color-surface-2)',
              color: 'var(--color-text-1)',
              fontSize: msgFontSize, lineHeight: 1.5,
              border: '0.5px solid var(--color-border)',
            }}>
              {streamingContent
                ? renderMarkdown(streamingContent)
                : (
                  <span style={{ display: 'flex', gap: '3px', alignItems: 'center', padding: '2px 0' }}>
                    {[0, 1, 2].map(j => (
                      <span key={j} style={{
                        width: '5px', height: '5px', borderRadius: '50%',
                        background: 'var(--color-brand)',
                        animation: `pulse 1.2s ${j * 0.2}s ease-in-out infinite`,
                        display: 'inline-block',
                      }} />
                    ))}
                  </span>
                )
              }
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: compact ? '10px 12px' : '12px 16px',
        borderTop: '0.5px solid var(--color-border)',
        display: 'flex', gap: '8px', alignItems: 'flex-end',
      }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => {
            setInput(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Ask your coach…'}
          rows={1}
          style={{
            flex: 1, resize: 'none', overflow: 'hidden',
            padding: '8px 10px', borderRadius: '8px',
            border: '0.5px solid var(--color-border-2)',
            background: 'var(--color-surface)',
            color: 'var(--color-text-1)',
            fontSize: inputFontSize, lineHeight: 1.5,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={submit}
          disabled={streaming || !input.trim()}
          style={{
            width: compact ? '32px' : '36px',
            height: compact ? '32px' : '36px',
            borderRadius: '8px',
            background: streaming || !input.trim() ? 'var(--color-surface-2)' : 'var(--color-brand)',
            border: '0.5px solid var(--color-border)',
            color: streaming || !input.trim() ? 'var(--color-text-3)' : '#fff',
            cursor: streaming || !input.trim() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', flexShrink: 0,
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          ↑
        </button>
      </div>
    </div>
  )
}
