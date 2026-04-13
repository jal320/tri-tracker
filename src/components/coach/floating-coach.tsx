'use client'

import { useState, useCallback, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ChatUI, Message } from './chat-ui'

const QUICK_PROMPTS = [
  'What should I do today?',
  'Am I ready for my next race?',
  'Analyze my last week of training',
]

export function FloatingCoach() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [hasKey, setHasKey] = useState<boolean | null>(null)
  const [greeted, setGreeted] = useState(false)
  const pathname = usePathname()

  // Check whether user has an API key configured
  useEffect(() => {
    fetch('/api/settings/coach')
      .then(r => r.json())
      .then(d => setHasKey(!!d.has_key))
      .catch(() => setHasKey(false))
  }, [])

  // Inject a greeting when the widget opens for the first time
  useEffect(() => {
    if (open && !greeted && messages.length === 0) {
      setGreeted(true)
      const pageLabels: Record<string, string> = {
        '/':           'your dashboard',
        '/fitness':    'your fitness metrics',
        '/races':      'your races',
        '/training':   'your training calendar',
        '/activities': 'your activity log',
        '/community':  'the community board',
        '/coach':      'the Training Coach',
      }
      const where = pageLabels[pathname] || 'the app'
      setMessages([{
        role: 'assistant',
        content: `Hey! I'm Coach Brick. I can see you're on ${where}. What's on your mind?`,
      }])
    }
  }, [open, greeted, messages.length, pathname])

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: Message = { role: 'user', content: text }
    const history = [...messages, userMsg]
    setMessages(history)
    setStreaming(true)
    setStreamingContent('')

    try {
      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(m => ({ role: m.role, content: m.content })),
          pagePath: pathname,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setMessages(prev => [...prev, { role: 'assistant', content: err.error || 'Something went wrong.' }])
        setStreaming(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setStreamingContent(full)
      }

      setMessages(prev => [...prev, { role: 'assistant', content: full }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }])
    } finally {
      setStreaming(false)
      setStreamingContent('')
    }
  }, [messages, pathname])

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="Training Coach"
          style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 500,
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'var(--color-brand)',
            border: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '22px',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.08)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)'
          }}
        >
          🏊
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 500,
          width: '360px', height: '520px',
          background: 'var(--color-surface)',
          border: '0.5px solid var(--color-border)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 14px',
            borderBottom: '0.5px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--color-surface)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'var(--color-brand)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, color: '#fff',
              }}>
                B
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-1)' }}>
                  Coach Brick
                </div>
                <div style={{ fontSize: '11px', color: streaming ? 'var(--color-brand)' : 'var(--color-text-3)' }}>
                  {streaming ? 'Thinking…' : 'AI Triathlon Coach'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <a
                href="/coach"
                title="Open full coach"
                style={{
                  fontSize: '14px', color: 'var(--color-text-3)',
                  textDecoration: 'none', padding: '4px',
                  borderRadius: '4px',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-1)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-3)')}
              >
                ⛶
              </a>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--color-text-3)', fontSize: '16px',
                  cursor: 'pointer', padding: '2px',
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick prompts — only when no real conversation yet */}
          {messages.length <= 1 && !streaming && (
            <div style={{
              padding: '8px 12px',
              borderBottom: '0.5px solid var(--color-border)',
              display: 'flex', gap: '6px', flexWrap: 'wrap',
              flexShrink: 0,
            }}>
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  style={{
                    padding: '4px 10px', borderRadius: '20px',
                    border: '0.5px solid var(--color-border-2)',
                    background: 'var(--color-surface-2)',
                    color: 'var(--color-text-2)', fontSize: '11px',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--color-brand)'
                    e.currentTarget.style.color = 'var(--color-brand)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border-2)'
                    e.currentTarget.style.color = 'var(--color-text-2)'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Chat */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ChatUI
              messages={messages}
              streaming={streaming}
              streamingContent={streamingContent}
              onSend={sendMessage}
              compact
              noKeyConfigured={hasKey === false}
            />
          </div>
        </div>
      )}
    </>
  )
}
