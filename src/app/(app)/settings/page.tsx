import { requireRealm } from "@/lib/auth"
import { getProperties } from "@/features/properties/queries"
import { PropertiesList } from "@/features/properties/components/properties-list"
import { AddPropertyForm } from "@/features/properties/components/add-property-form"
import { Separator } from "@/components/ui/separator"

export default async function SettingsPage() {
  const { realm } = await requireRealm()
  const properties = await getProperties(realm.id)

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your Realm and Properties.</p>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Realm</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{realm.name}</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Properties</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Websites you&apos;re tracking rankings for.
          </p>
        </div>
        <PropertiesList properties={properties} />
        <AddPropertyForm />
      </div>
    </div>
  )
}
