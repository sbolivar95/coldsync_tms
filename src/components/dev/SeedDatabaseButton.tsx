import { useState } from 'react'
import { Button } from '../ui/Button'
import { seedDatabase, clearSeedData } from '../../services/database/seed'
import { useAppStore } from '../../stores/useAppStore'
import { toast } from 'sonner'
import { Database, Trash2, RotateCcw } from 'lucide-react'

function formatSeedSummary(data: Record<string, number> | undefined): string {
  if (!data) return ''
  const lines = [
    `Thermal profiles: ${data.thermalProfiles ?? 0}`,
    `Products: ${data.products ?? 0}`,
    `Carriers: ${data.carriers ?? 0}`,
    `Drivers: ${data.drivers ?? 0}`,
    `Vehicles: ${data.vehicles ?? 0}`,
    `Trailers: ${data.trailers ?? 0}`,
    `Locations: ${data.locations ?? 0}`,
    `Routes: ${data.routes ?? 0}`,
    `Fleet sets: ${data.fleetSets ?? 0}`,
    `Carrier contracts: ${data.carrierContracts ?? 0}`,
    `Rate cards: ${data.rateCards ?? 0}`,
    `Rate tiers: ${data.rateTiers ?? 0}`,
  ]
  return lines.join('  •  ')
}

/**
 * Development utility component for seeding the database
 * Only show in development mode or for admin users
 */
export function SeedDatabaseButton() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const organization = useAppStore((state) => state.organization)
  const orgId = organization?.id

  const handleSeed = async () => {
    if (!orgId) {
      toast.error('No organization selected')
      return
    }

    setIsSeeding(true)
    try {
      console.log('🌱 [Seed] Starting seed for org:', orgId)
      const result = await seedDatabase(orgId)
      if (result.success) {
        const summary = formatSeedSummary(result.data)
        console.log('🌱 [Seed] Result:', result.data)
        toast.success(result.message, {
          description: summary,
          duration: 8000,
        })
      } else {
        toast.error(result.message || 'Failed to seed database')
        console.error('Seed error:', result.error)
      }
    } catch (error: any) {
      toast.error(`Seed failed: ${error.message}`)
      console.error('Seed error:', error)
    } finally {
      setIsSeeding(false)
    }
  }

  const handleResetAndSeed = async () => {
    if (!orgId) {
      toast.error('No organization selected')
      return
    }

    const confirmed = window.confirm(
      '⚠️ Clear ALL seed data (including dispatch orders) and re-seed? This cannot be undone.'
    )
    if (!confirmed) return

    setIsResetting(true)
    try {
      console.log('🗑️ [Reset & Seed] Clearing data...')
      const clearResult = await clearSeedData(orgId)
      if (!clearResult.success) {
        toast.error(clearResult.message || 'Failed to clear data')
        return
      }
      console.log('🌱 [Reset & Seed] Seeding...')
      const seedResult = await seedDatabase(orgId)
      if (seedResult.success) {
        const summary = formatSeedSummary(seedResult.data)
        console.log('🌱 [Reset & Seed] Seeded:', seedResult.data)
        toast.success('Data cleared and re-seeded', {
          description: summary,
          duration: 8000,
        })
      } else {
        toast.error(seedResult.message || 'Seed failed after clear')
      }
    } catch (error: any) {
      toast.error(`Reset & seed failed: ${error.message}`)
      console.error('Reset & seed error:', error)
    } finally {
      setIsResetting(false)
    }
  }

  const handleClear = async () => {
    if (!orgId) {
      toast.error('No organization selected')
      return
    }

    const confirmed = window.confirm(
      '⚠️ Are you sure you want to clear all seed data (including dispatch orders)? This cannot be undone!'
    )

    if (!confirmed) return

    setIsClearing(true)
    try {
      console.log('🗑️ [Clear] Clearing seed data for org:', orgId)
      const result = await clearSeedData(orgId)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message || 'Failed to clear seed data')
      }
    } catch (error: any) {
      toast.error(`Clear failed: ${error.message}`)
      console.error('Clear error:', error)
    } finally {
      setIsClearing(false)
    }
  }


  if (!orgId) {
    return null
  }

  return (
    <div className="flex gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-yellow-900 mb-1">
          Development Tools
        </h3>
        <p className="text-xs text-yellow-700">
          Seed database with test data for dispatch testing
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleResetAndSeed}
          disabled={isSeeding || isClearing || isResetting}
          variant="default"
          size="sm"
          className="gap-2 bg-amber-600 hover:bg-amber-700"
          title="Clear all data then seed (dispatch orders, rate cards, routes, etc.)"
        >
          <RotateCcw className="w-4 h-4" />
          {isResetting ? 'Clearing & seeding...' : 'Reset & Seed'}
        </Button>
        <Button
          onClick={handleSeed}
          disabled={isSeeding || isClearing || isResetting}
          variant="default"
          size="sm"
          className="gap-2"
          title="Seed master data only (keeps existing data; may fail if tables already have data)"
        >
          <Database className="w-4 h-4" />
          {isSeeding ? 'Seeding...' : 'Seed Database'}
        </Button>
        <Button
          onClick={handleClear}
          disabled={isSeeding || isClearing || isResetting}
          variant="destructive"
          size="sm"
          className="gap-2"
          title="Delete all seed data including dispatch orders and costs"
        >
          <Trash2 className="w-4 h-4" />
          {isClearing ? 'Clearing...' : 'Clear Data'}
        </Button>
      </div>
    </div>
  )
}
