export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your realm at a glance.
        </p>
      </div>
      <div className="text-muted-foreground text-sm">
        No spells cast yet. Add keywords to start tracking.
      </div>
    </div>
  )
}
