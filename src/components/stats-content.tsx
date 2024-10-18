import { getAllCompletedEntries, getAllEntriesThisWeek } from '@/lib/actions'
import { ChartPeePoo } from '@/components/chart-pee-poo'
import { ChartTripsPerDay } from '@/components/chart-trips-per-day'
import { StatCard } from '@/components/start-card'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import {
  processEntriesForPoopPeeChart,
  processEntriesForTripsChart,
  calculateStats,
} from '@/lib/process-entries-for-charts'
import { capitalizeName, pluralize } from '@/lib/utils'

export async function StatsContent() {
  const allEntries = await getAllCompletedEntries()
  const thisWeeksEntries = await getAllEntriesThisWeek()

  const stats = calculateStats(thisWeeksEntries)
  const poopPeeChartData = processEntriesForPoopPeeChart(allEntries)
  const tripsChartData = processEntriesForTripsChart(thisWeeksEntries)

  return (
    <main className="my-8">
      <section className="mb-8">
        <h2 className="text-lg text-center mb-2 font-semibold">
          Top walkers this week 🏆
        </h2>

        <ul>
          {stats?.topWalkers.map((walker, index) => (
            <li
              key={walker.user.email}
              className="flex items-center p-3 border-b last:border-b-0"
            >
              <span className="text-sm font-semibold text-secondary-foreground mr-4">
                {index + 1}
              </span>

              <Avatar className="mr-3">
                <AvatarImage src={walker.user.image ?? undefined} />
              </Avatar>
              <p className="font-medium truncate">
                {capitalizeName(walker.user.name)}
              </p>

              <span className="text-sm font-semibold text-secondary-foreground ml-auto">
                {walker.trips} {pluralize(walker.trips, 'walk', 'walks')}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg text-center mb-2 font-semibold">
          Statistics for Ani last 7 days
        </h2>

        <div className="grid grid-cols-2">
          <StatCard title="Total number of trips" value={stats?.totalTrips} />
          <StatCard
            title="Average trips/day"
            value={stats?.averageTripsPerDay.toFixed(1)}
          />
          <StatCard title="Ani poopoo" value={`${stats?.totalPoops} times`} />
          <StatCard title="Ani peepee" value={`${stats?.totalPees} times`} />
          <StatCard
            title="Longest walk"
            value={`${stats?.longestTrip} minutes`}
          />
          <StatCard
            title="Success rate"
            value={`${(stats?.successRate * 100).toFixed(1)}%`}
          />
          <StatCard
            title="Mostly relieves herself"
            value={
              stats?.mostCommonLocation === 'outside'
                ? 'Outside 🙂‍↕️'
                : 'Inside 😭'
            }
          />
          <StatCard
            title="Average duration"
            value={`${stats?.averageTripDuration.toFixed(1)} minutes`}
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg text-center mb-2 font-semibold">
          Pee and poop over time
        </h2>
        <div className="w-full">
          <ChartPeePoo chartData={poopPeeChartData} />
        </div>
      </section>

      <section>
        <h2 className="text-lg text-center mb-2 font-semibold">
          Trips per day last 7 days
        </h2>
        <div className="w-full">
          <ChartTripsPerDay chartData={tripsChartData} />
        </div>
      </section>
    </main>
  )
}
