"use client"

import { useActionState } from "react"
import { createRealmWithProperty } from "@/features/realms/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const initialState = { error: undefined as string | undefined }

export function OnboardingForm() {
  const [state, action, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await createRealmWithProperty(formData)
      return result ?? initialState
    },
    initialState
  )

  return (
    <form action={action} className="space-y-4">
      <Card className="gradient-border bg-card border-0">
        <CardHeader>
          <CardTitle className="text-base">Your Realm</CardTitle>
          <CardDescription>This is your workspace — name it after your company or project.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="realmName">Realm name</Label>
            <Input id="realmName" name="realmName" placeholder="Acme Inc." required />
          </div>
        </CardContent>
      </Card>

      <Card className="gradient-border bg-card border-0">
        <CardHeader>
          <CardTitle className="text-base">First Property</CardTitle>
          <CardDescription>The website you want to track rankings for.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="propertyUrl">URL</Label>
            <Input id="propertyUrl" name="propertyUrl" type="url" placeholder="https://example.com" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="propertyDisplayName">Display name</Label>
            <Input id="propertyDisplayName" name="propertyDisplayName" placeholder="Example.com" required />
          </div>
        </CardContent>
      </Card>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full glow-primary-sm">
        {pending ? "Creating your Realm…" : "Enter Merlin →"}
      </Button>
    </form>
  )
}
