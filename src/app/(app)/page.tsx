import { RaceBanner } from '@/components/dashboard/race-banner'
import { TodaysPlan } from '@/components/dashboard/todays-plan'
import { WeeklyOverview } from '@/components/dashboard/weekly-overview'
import { FitnessStats } from '@/components/dashboard/fitness-stats'
import { RecentActivities } from '@/components/dashboard/recent-activities'
import { Leaderboard } from '@/components/dashboard/leaderboard'
import { TriCoachNudge } from '@/components/dashboard/tri-coach-nudge'

export default function DashboardPage() {
  return (
    <div>
      <RaceBanner />
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        gap: '16px',
        alignItems: 'start',
      }}>
        <div>
          <TodaysPlan />
          <WeeklyOverview />
          <FitnessStats />
        </div>
        <div>
          <RecentActivities />
          <Leaderboard />
          <TriCoachNudge />
        </div>
      </div>
    </div>
  )
}
