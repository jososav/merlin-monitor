import { requireUser } from "@/lib/auth"
import { getCurrentRealm } from "@/lib/auth"
import { redirect } from "next/navigation"
import { OnboardingForm } from "@/features/realms/components/onboarding-form"

export default async function OnboardingPage() {
  const user = await requireUser()
  const realm = await getCurrentRealm(user.id)
  if (realm) redirect("/dashboard")

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 glow-primary-sm mb-2">
            <span className="text-3xl">🔮</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Set up your Realm</h1>
          <p className="text-muted-foreground text-sm">
            Create your workspace and add your first property to track.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  )
}
