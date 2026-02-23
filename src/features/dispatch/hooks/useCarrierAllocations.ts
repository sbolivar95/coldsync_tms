import { useState, useCallback, useEffect } from 'react'
import { carrierAllocationService, type CarrierAllocationStatus } from '../../../services/database/carrierAllocation.service'


export function useCarrierAllocations(orgId: string | null | undefined) {
  const [allocationStatuses, setAllocationStatuses] = useState<Record<number, CarrierAllocationStatus>>({})
  const [isLoading, setIsLoading] = useState(false)

  const loadAllocationStatuses = useCallback(async () => {
    if (!orgId) {
      setAllocationStatuses({})
      return
    }

    try {
      setIsLoading(true)
      const data = await carrierAllocationService.getOrgAllocationStatuses(orgId)
      if (data) {
        setAllocationStatuses(data)
      }
    } catch (error) {
      console.error('Error loading allocation statuses:', error)
      // Silent error or toast? Silent is better for poller/background, but this is init load.
      // toast.error('Error loading allocation stats') 
    } finally {
      setIsLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    loadAllocationStatuses()
  }, [loadAllocationStatuses])

  const getAllocationStatus = useCallback((carrierId: number | undefined) => {
    if (!carrierId) return null
    return allocationStatuses[carrierId] || null
  }, [allocationStatuses])

  return {
    allocationStatuses,
    getAllocationStatus,
    isLoading,
    reloadAllocations: loadAllocationStatuses
  }
}
