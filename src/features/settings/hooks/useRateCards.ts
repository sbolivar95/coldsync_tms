import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { RateCardWithCharges } from '../../../services/database/rateCards.service'
import { rateCardsService } from '../../../services/database/rateCards.service'
import { rateCardThermalModifiersService } from '../../../services/database/rateCardThermalModifiers.service'
import { lanesService } from '../../../services/database/lanes.service'
import { carriersService } from '../../../services/database/carriers.service'
import { useAppStore } from '../../../stores/useAppStore'
import type { Lane } from '../../../types/database.types'
import type { Carrier } from '../../../types/database.types'
import type { RateCardFormData } from '../../../lib/schemas/rateCard.schemas'

/**
 * Custom hook for managing rate cards state and operations
 * Uses Zustand store for shared state between components (similar to useProducts)
 */
export function useRateCards(orgId: string) {
  // Use Zustand store for rate cards (shared state)
  const rateCards = useAppStore((state) => state.rateCards)
  const isLoading = useAppStore((state) => state.rateCardsLoading)
  const rateCardsLoadedOrgId = useAppStore((state) => state.rateCardsLoadedOrgId)
  const setRateCards = useAppStore((state) => state.setRateCards)
  const setRateCardsLoading = useAppStore((state) => state.setRateCardsLoading)
  const setRateCardsLoadedOrgId = useAppStore((state) => state.setRateCardsLoadedOrgId)

  // Confirmation dialogs state (delete / bulk delete / permanent delete)
  const [deleteRateCardDialogOpen, setDeleteRateCardDialogOpen] = useState(false)
  const [bulkDeleteRateCardDialogOpen, setBulkDeleteRateCardDialogOpen] = useState(false)
  const [permanentDeleteRateCardDialogOpen, setPermanentDeleteRateCardDialogOpen] = useState(false)
  const [permanentDeleteCheckStatus, setPermanentDeleteCheckStatus] = useState<
    'idle' | 'checking' | 'allowed' | 'blocked'
  >('idle')
  const [isPermanentDeleteConfirming, setIsPermanentDeleteConfirming] = useState(false)
  const [rateCardToAction, setRateCardToAction] = useState<RateCardWithCharges | undefined>(
    undefined
  )
  const [rateCardsToDelete, setRateCardsToDelete] = useState<string[]>([])
  const [bulkPermanentDeleteRateCardDialogOpen, _setBulkPermanentDeleteRateCardDialogOpen] =
    useState(false)
  const [bulkPermanentDeleteChecking, setBulkPermanentDeleteChecking] = useState(false)
  const [isBulkPermanentDeleteConfirming, setIsBulkPermanentDeleteConfirming] = useState(false)
  const [bulkPermanentDeleteIds, setBulkPermanentDeleteIds] = useState<string[]>([])
  const [bulkPermanentDeleteSummary, setBulkPermanentDeleteSummary] = useState<{
    canDelete: number
    skipped: number
  } | null>(null)

  const setBulkPermanentDeleteRateCardDialogOpen = useCallback((open: boolean) => {
    if (!open) {
      setBulkPermanentDeleteIds([])
      setBulkPermanentDeleteSummary(null)
      setBulkPermanentDeleteChecking(false)
    }
    _setBulkPermanentDeleteRateCardDialogOpen(open)
  }, [])

  const setPermanentDeleteRateCardDialogOpenWithReset = useCallback((open: boolean) => {
    if (!open) {
      setPermanentDeleteCheckStatus('idle')
      setRateCardToAction(undefined)
    }
    setPermanentDeleteRateCardDialogOpen(open)
  }, [])

  // Run usage check when single permanent-delete dialog opens with a rate card
  useEffect(() => {
    if (
      !permanentDeleteRateCardDialogOpen ||
      !rateCardToAction ||
      permanentDeleteCheckStatus !== 'checking'
    )
      return
    let cancelled = false
    rateCardsService
      .getDispatchOrderCountForRateCard(rateCardToAction.id)
      .then((count) => {
        if (cancelled) return
        setPermanentDeleteCheckStatus(count > 0 ? 'blocked' : 'allowed')
      })
      .catch(() => {
        if (cancelled) return
        setPermanentDeleteCheckStatus('idle')
        toast.error('Error al comprobar si el tarifario está en uso')
      })
    return () => {
      cancelled = true
    }
  }, [permanentDeleteRateCardDialogOpen, rateCardToAction, permanentDeleteCheckStatus])

  // Batch duplicate dialog state
  const [batchDuplicateDialogOpen, setBatchDuplicateDialogOpen] = useState(false)
  const [rateCardToBatchDuplicate, setRateCardToBatchDuplicate] = useState<RateCardWithCharges | undefined>(
    undefined
  )
  const [sourceThermalModifiers, setSourceThermalModifiers] = useState<
    Array<{ thermal_profile_id: number; modifier_type: 'MULTIPLIER' | 'FIXED_ADD'; value: number }>
  >([])
  const [lanes, setLanes] = useState<Lane[]>([])
  const [carriers, setCarriers] = useState<Carrier[]>([])

  // Load lanes and carriers for batch duplicate dialog
  useEffect(() => {
    if (!orgId) return
    const load = async () => {
      try {
        const [lanesData, carriersData] = await Promise.all([
          lanesService.getAll(orgId),
          carriersService.getAll(orgId),
        ])
        setLanes(lanesData)
        setCarriers(carriersData)
      } catch (e) {
        console.error('Error loading lanes/carriers for rate card:', e)
      }
    }
    load()
  }, [orgId])

  // Load rate cards data with intelligent caching
  const loadRateCards = async (force = false) => {
    if (!orgId) {
      setRateCards([])
      setRateCardsLoadedOrgId(null)
      return
    }

    // Skip if already loaded for this orgId and not forcing reload
    if (!force && rateCardsLoadedOrgId === orgId && rateCards.length > 0) {
      return
    }

    try {
      setRateCardsLoading(true)
      const data = await rateCardsService.getAll(orgId)
      setRateCards(data)
      setRateCardsLoadedOrgId(orgId)
    } catch (error) {
      console.error('Error loading rate cards:', error)
      toast.error('Error al cargar los tarifarios')
      setRateCards([])
      setRateCardsLoadedOrgId(null)
    } finally {
      setRateCardsLoading(false)
    }
  }

  const handleRateCardDelete = (rateCard: RateCardWithCharges) => {
    setRateCardToAction(rateCard)
    setDeleteRateCardDialogOpen(true)
  }

  const handleConfirmDeleteRateCard = async () => {
    if (!rateCardToAction || !orgId) {
      toast.error('Error: tarifario u organización no válidos')
      return
    }

    try {
      await rateCardsService.softDelete(rateCardToAction.id, orgId)
      toast.success(`Tarifario ${rateCardToAction.name || 'sin nombre'} desactivado correctamente`)
      loadRateCards(true) // Force reload after delete
    } catch (error) {
      console.error('Error eliminando tarifario:', error)
      toast.error('Error al eliminar el tarifario')
    } finally {
      setDeleteRateCardDialogOpen(false)
      setRateCardToAction(undefined)
    }
  }

  const handleRateCardReactivate = async (rateCard: RateCardWithCharges) => {
    if (!orgId) {
      toast.error('No hay organización seleccionada')
      return
    }

    try {
      await rateCardsService.reactivate(rateCard.id, orgId)
      toast.success('Tarifario reactivado correctamente')
      loadRateCards(true) // Force reload after reactivate
    } catch (error) {
      console.error('Error reactivando tarifario:', error)
      toast.error('Error al reactivar el tarifario')
    }
  }

  /** Opens permanent-delete dialog immediately; usage check runs in background (see useEffect). */
  const handlePermanentDeleteRequest = useCallback(
    (rateCard: RateCardWithCharges) => {
      if (!orgId) {
        toast.error('No hay organización seleccionada')
        return
      }
      setRateCardToAction(rateCard)
      setPermanentDeleteCheckStatus('checking')
      setPermanentDeleteRateCardDialogOpen(true)
    },
    [orgId]
  )

  const handleConfirmPermanentDeleteRateCard = useCallback(async () => {
    if (!rateCardToAction || !orgId) return
    setIsPermanentDeleteConfirming(true)
    try {
      await rateCardsService.hardDelete(rateCardToAction.id, orgId)
      toast.success('Tarifario eliminado permanentemente')
      loadRateCards(true)
      setPermanentDeleteRateCardDialogOpen(false)
      setRateCardToAction(undefined)
      setPermanentDeleteCheckStatus('idle')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al eliminar el tarifario'
      toast.error(message)
      setPermanentDeleteRateCardDialogOpen(false)
      setRateCardToAction(undefined)
      setPermanentDeleteCheckStatus('idle')
    } finally {
      setIsPermanentDeleteConfirming(false)
    }
  }, [rateCardToAction, orgId, loadRateCards])

  const handleRateCardBulkDelete = (rateCardIds: string[]) => {
    setRateCardsToDelete(rateCardIds)
    setBulkDeleteRateCardDialogOpen(true)
  }

  /** Bulk permanent delete: opens dialog immediately with "checking", then runs usage checks for all selected (active or inactive). */
  const handleBulkPermanentDeleteRequest = useCallback(
    (rateCardIds: string[]) => {
      if (!orgId) {
        toast.error('No hay organización seleccionada')
        return
      }
      if (rateCardIds.length === 0) return
      setBulkPermanentDeleteChecking(true)
      setBulkPermanentDeleteSummary(null)
      setBulkPermanentDeleteIds([])
      setBulkPermanentDeleteRateCardDialogOpen(true)

      const selected = rateCards.filter((rc) => rateCardIds.includes(rc.id))
      const checkOne = async (rc: RateCardWithCharges): Promise<string | null> => {
        const count = await rateCardsService.getDispatchOrderCountForRateCard(rc.id)
        return count === 0 ? rc.id : null
      }
      Promise.all(selected.map(checkOne))
        .then((ids) => {
          const canDelete = ids.filter((id): id is string => id !== null)
          setBulkPermanentDeleteChecking(false)
          if (canDelete.length === 0) {
            setBulkPermanentDeleteRateCardDialogOpen(false)
            toast.error(
              'Ninguno se puede eliminar permanentemente: todos están asociados a órdenes de despacho (costes calculados).'
            )
            return
          }
          setBulkPermanentDeleteIds(canDelete)
          setBulkPermanentDeleteSummary({
            canDelete: canDelete.length,
            skipped: rateCardIds.length - canDelete.length,
          })
        })
        .catch((e) => {
          console.error('Error comprobando tarifarios:', e)
          setBulkPermanentDeleteChecking(false)
          setBulkPermanentDeleteRateCardDialogOpen(false)
          toast.error('Error al comprobar los tarifarios')
        })
    },
    [orgId, rateCards]
  )

  const handleConfirmBulkPermanentDeleteRateCard = useCallback(async () => {
    if (!orgId || bulkPermanentDeleteIds.length === 0) {
      setBulkPermanentDeleteRateCardDialogOpen(false)
      setBulkPermanentDeleteIds([])
      setBulkPermanentDeleteSummary(null)
      return
    }
    setIsBulkPermanentDeleteConfirming(true)
    try {
      for (const id of bulkPermanentDeleteIds) {
        await rateCardsService.hardDelete(id, orgId)
      }
      toast.success(`${bulkPermanentDeleteIds.length} tarifario(s) eliminado(s) permanentemente`)
      loadRateCards(true)
      setBulkPermanentDeleteRateCardDialogOpen(false)
      setBulkPermanentDeleteIds([])
      setBulkPermanentDeleteSummary(null)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al eliminar los tarifarios'
      toast.error(message)
    } finally {
      setIsBulkPermanentDeleteConfirming(false)
    }
  }, [orgId, bulkPermanentDeleteIds, loadRateCards])

  const handleConfirmBulkDeleteRateCard = async () => {
    if (!orgId) {
      toast.error('No hay organización seleccionada')
      setBulkDeleteRateCardDialogOpen(false)
      setRateCardsToDelete([])
      return
    }

    if (rateCardsToDelete.length === 0) {
      setBulkDeleteRateCardDialogOpen(false)
      setRateCardsToDelete([])
      return
    }

    try {
      await Promise.all(
        rateCardsToDelete.map((id) => rateCardsService.softDelete(id, orgId))
      )
      toast.success(`${rateCardsToDelete.length} tarifario(s) desactivado(s) correctamente`)
      loadRateCards(true) // Force reload after bulk delete
    } catch (error) {
      console.error('Error eliminando tarifarios:', error)
      toast.error('Error al desactivar los tarifarios')
    } finally {
      setBulkDeleteRateCardDialogOpen(false)
      setRateCardsToDelete([])
    }
  }

  /** Save from detail page (full-page form). */
  const handleRateCardSaveFromDetail = async (
    rateCard: RateCardWithCharges | null | undefined,
    rateCardData: RateCardFormData,
    thermalModifiers?: Array<{ thermal_profile_id: number; modifier_type: 'MULTIPLIER' | 'FIXED_ADD'; value: number }>
  ) => {
    if (!orgId) {
      toast.error('No hay organización seleccionada')
      throw new Error('No orgId')
    }

    let rateCardId: string
    if (rateCard?.id) {
      await rateCardsService.update(rateCard.id, orgId, rateCardData)
      rateCardId = rateCard.id
      toast.success('Tarifario actualizado correctamente')
    } else {
      const created = await rateCardsService.create({
        ...rateCardData,
        org_id: orgId,
      })
      rateCardId = created.id
      toast.success('Tarifario creado correctamente')
    }

    if (thermalModifiers && thermalModifiers.length > 0) {
      await rateCardThermalModifiersService.deleteAllForRateCard(rateCardId)
      for (const m of thermalModifiers) {
        await rateCardThermalModifiersService.upsert({
          rate_card_id: rateCardId,
          thermal_profile_id: m.thermal_profile_id,
          modifier_type: m.modifier_type,
          value: m.value,
        })
      }
    } else if (rateCardId && rateCard?.id) {
      await rateCardThermalModifiersService.deleteAllForRateCard(rateCardId)
    }

    loadRateCards(true)
  }

  const handleOpenBatchDuplicateDialog = useCallback(
    async (rateCard: RateCardWithCharges) => {
      setRateCardToBatchDuplicate(rateCard)
      try {
        const mods = await rateCardThermalModifiersService.getByRateCardIdWithProfiles(rateCard.id)
        setSourceThermalModifiers(
          mods.map((m) => ({
            thermal_profile_id: m.thermal_profile_id,
            modifier_type: m.modifier_type as 'MULTIPLIER' | 'FIXED_ADD',
            value: Number(m.value),
          }))
        )
        setBatchDuplicateDialogOpen(true)
      } catch (e) {
        console.error('Error loading thermal modifiers:', e)
        setSourceThermalModifiers([])
        setBatchDuplicateDialogOpen(true)
      }
    },
    []
  )

  const handleCloseBatchDuplicateDialog = useCallback(() => {
    setBatchDuplicateDialogOpen(false)
    setRateCardToBatchDuplicate(undefined)
    setSourceThermalModifiers([])
  }, [])

  function rateCardToFormData(rc: RateCardWithCharges): RateCardFormData {
    return {
      name: rc.name,
      lane_id: rc.lane_id,
      carrier_id: rc.carrier_id,
      thermal_profile_id: rc.thermal_profile_id,
      valid_from: rc.valid_from,
      valid_to: rc.valid_to,
      is_active: rc.is_active,
      charges: (rc.rate_card_charges || []).map((c) => ({
        charge_type: c.charge_type,
        rate_basis: c.rate_basis,
        value: c.value,
        label: c.label,
        sort_order: c.sort_order,
        is_active: c.is_active,
        apply_before_pct: c.apply_before_pct,
        weight_source: (c as { weight_source?: string }).weight_source ?? 'ACTUAL',
        breaks: (c.rate_charge_breaks || []).map((b) => ({
          min_value: b.min_value,
          max_value: b.max_value,
          rate_value: b.rate_value,
        })),
      })),
    }
  }

  const handleBatchDuplicate = useCallback(
    async (
      laneIds: string[],
      carrierIds: (number | null)[],
      sourceRateCard: RateCardWithCharges,
      sourceThermalModifiersForCreate: Array<{
        thermal_profile_id: number
        modifier_type: 'MULTIPLIER' | 'FIXED_ADD'
        value: number
      }>
    ) => {
      if (!orgId) {
        toast.error('No hay organización seleccionada')
        return
      }
      const formData = rateCardToFormData(sourceRateCard)
      const totalCount = laneIds.length * carrierIds.length
      try {
        for (const laneId of laneIds) {
          const baseData: RateCardFormData = {
            ...formData,
            lane_id: laneId,
            name: formData.name ? `${formData.name} - Copia` : null,
          }
          for (const carrierId of carrierIds) {
            const toCreate = { ...baseData, carrier_id: carrierId }
            const created = await rateCardsService.create({ ...toCreate, org_id: orgId })
            if (sourceThermalModifiersForCreate.length > 0) {
              for (const m of sourceThermalModifiersForCreate) {
                await rateCardThermalModifiersService.upsert({
                  rate_card_id: created.id,
                  thermal_profile_id: m.thermal_profile_id,
                  modifier_type: m.modifier_type,
                  value: m.value,
                })
              }
            }
          }
        }
        toast.success(`${totalCount} tarifario(s) creado(s) correctamente`)
        loadRateCards(true)
      } catch (e) {
        console.error('Error duplicando tarifarios:', e)
        toast.error('Error al duplicar los tarifarios')
      }
    },
    [orgId]
  )

  // Load rate cards only when orgId changes (not on every mount)
  useEffect(() => {
    // Only load if orgId changed or hasn't been loaded yet
    if (orgId && (rateCardsLoadedOrgId !== orgId || rateCards.length === 0)) {
      loadRateCards()
    } else if (!orgId) {
      setRateCards([])
      setRateCardsLoadedOrgId(null)
    }
  }, [orgId, rateCardsLoadedOrgId, rateCards.length])

  return {
    // Data
    rateCards,
    isLoading,

    // State
    deleteRateCardDialogOpen,
    bulkDeleteRateCardDialogOpen,
    permanentDeleteRateCardDialogOpen,
    permanentDeleteCheckStatus,
    isPermanentDeleteConfirming,
    bulkPermanentDeleteRateCardDialogOpen,
    bulkPermanentDeleteChecking,
    bulkPermanentDeleteSummary,
    isBulkPermanentDeleteConfirming,
    rateCardToAction,
    rateCardsToDelete,

    // Actions
    handleRateCardDelete,
    handleConfirmDeleteRateCard,
    handleRateCardReactivate,
    handlePermanentDeleteRequest,
    handleConfirmPermanentDeleteRateCard,
    handleRateCardBulkDelete,
    handleConfirmBulkDeleteRateCard,
    handleBulkPermanentDeleteRequest,
    handleConfirmBulkPermanentDeleteRateCard,
    setPermanentDeleteRateCardDialogOpen: setPermanentDeleteRateCardDialogOpenWithReset,
    setBulkPermanentDeleteRateCardDialogOpen,
    handleRateCardSaveFromDetail,
    loadRateCards,
    setDeleteRateCardDialogOpen,
    setBulkDeleteRateCardDialogOpen,

    // Batch duplicate
    batchDuplicateDialogOpen,
    rateCardToBatchDuplicate,
    sourceThermalModifiers,
    lanes,
    carriers,
    handleOpenBatchDuplicateDialog,
    handleCloseBatchDuplicateDialog,
    handleBatchDuplicate,
  }
}
