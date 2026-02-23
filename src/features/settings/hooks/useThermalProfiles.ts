import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import type { ThermalProfile } from '../../../types/database.types'
import { thermalProfilesService } from '../../../services/database'
import { useAppStore } from '../../../stores/useAppStore'

/**
 * Custom hook for managing thermal profiles state and operations
 * Uses Zustand store for shared state between components (similar to useUsers)
 */
export function useThermalProfiles(orgId: string) {
  const navigate = useNavigate()
  
  // Use Zustand store for thermal profiles (shared state)
  const thermalProfiles = useAppStore((state) => state.thermalProfiles)
  const isLoading = useAppStore((state) => state.thermalProfilesLoading)
  const thermalProfilesLoadedOrgId = useAppStore((state) => state.thermalProfilesLoadedOrgId)
  const setThermalProfiles = useAppStore((state) => state.setThermalProfiles)
  const setThermalProfilesLoading = useAppStore((state) => state.setThermalProfilesLoading)
  const setThermalProfilesLoadedOrgId = useAppStore((state) => state.setThermalProfilesLoadedOrgId)

  // Local state for dialogs and UI (not shared)
  const [selectedThermalProfile, setSelectedThermalProfile] = useState<ThermalProfile | undefined>(undefined)
  const [thermalProfileDialogOpen, setThermalProfileDialogOpen] = useState(false)

  // Confirmation dialogs state
  const [deleteThermalProfileDialogOpen, setDeleteThermalProfileDialogOpen] = useState(false)
  const [bulkDeleteThermalProfileDialogOpen, setBulkDeleteThermalProfileDialogOpen] = useState(false)
  const [thermalProfileToAction, setThermalProfileToAction] = useState<ThermalProfile | undefined>(undefined)
  const [thermalProfilesToDelete, setThermalProfilesToDelete] = useState<string[]>([])

  // Load thermal profiles data with intelligent caching
  const loadThermalProfiles = async (force = false) => {
    if (!orgId) {
      setThermalProfiles([])
      setThermalProfilesLoadedOrgId(null)
      return
    }

    // Skip if already loaded for this orgId and not forcing reload
    if (!force && thermalProfilesLoadedOrgId === orgId && thermalProfiles.length > 0) {
      return
    }

    try {
      setThermalProfilesLoading(true)
      const data = await thermalProfilesService.getAll(orgId)
      setThermalProfiles(data)
      setThermalProfilesLoadedOrgId(orgId)
    } catch (error) {
      console.error('Error loading thermal profiles:', error)
      toast.error('Error al cargar los perfiles térmicos')
      setThermalProfiles([])
      setThermalProfilesLoadedOrgId(null)
    } finally {
      setThermalProfilesLoading(false)
    }
  }

  // Handlers
  const handleThermalProfileEdit = (profile: ThermalProfile) => {
    setSelectedThermalProfile(profile)
    setThermalProfileDialogOpen(true)
  }

  const handleThermalProfileEditById = useCallback((profileId: string) => {
    const profile = thermalProfiles.find(p => p.id.toString() === profileId)
    if (profile) {
      handleThermalProfileEdit(profile)
    }
  }, [thermalProfiles])

  const handleThermalProfileDelete = (profile: ThermalProfile) => {
    setThermalProfileToAction(profile)
    setDeleteThermalProfileDialogOpen(true)
  }

  const handleConfirmDeleteThermalProfile = async () => {
    if (!thermalProfileToAction || !orgId) {
      toast.error('Error: perfil térmico o organización no válidos')
      return
    }

    try {
      await thermalProfilesService.softDelete(thermalProfileToAction.id, orgId)
      toast.success(`Perfil térmico ${thermalProfileToAction.name} eliminado correctamente`)
      loadThermalProfiles()
    } catch (error) {
      console.error('Error eliminando perfil térmico:', error)
      toast.error('Error al eliminar el perfil térmico')
    } finally {
      setDeleteThermalProfileDialogOpen(false)
      setThermalProfileToAction(undefined)
    }
  }

  const handleThermalProfileReactivate = async (profile: ThermalProfile) => {
    if (!orgId) {
      toast.error('No hay organización seleccionada')
      return
    }

    try {
      await thermalProfilesService.reactivate(profile.id, orgId)
      toast.success('Perfil térmico reactivado correctamente')
      loadThermalProfiles(true) // Force reload after reactivate
    } catch (error) {
      console.error('Error reactivando perfil térmico:', error)
      toast.error('Error al reactivar el perfil térmico')
    }
  }

  const handleThermalProfileBulkDelete = (profileIds: string[]) => {
    setThermalProfilesToDelete(profileIds)
    setBulkDeleteThermalProfileDialogOpen(true)
  }

  const handleConfirmBulkDeleteThermalProfile = async () => {
    if (!orgId) {
      toast.error('No hay organización seleccionada')
      setBulkDeleteThermalProfileDialogOpen(false)
      setThermalProfilesToDelete([])
      return
    }

    if (thermalProfilesToDelete.length === 0) {
      setBulkDeleteThermalProfileDialogOpen(false)
      setThermalProfilesToDelete([])
      return
    }

    try {
      await Promise.all(
        thermalProfilesToDelete.map((id) => thermalProfilesService.softDelete(Number(id), orgId))
      )
      toast.success(`${thermalProfilesToDelete.length} perfil(es) térmico(s) eliminado(s) correctamente`)
      loadThermalProfiles(true) // Force reload after bulk delete
    } catch (error) {
      console.error('Error eliminando perfiles térmicos:', error)
      toast.error('Error al eliminar los perfiles térmicos')
    } finally {
      setBulkDeleteThermalProfileDialogOpen(false)
      setThermalProfilesToDelete([])
    }
  }

  const handleThermalProfileSave = async (
    profile: Omit<ThermalProfile, 'id' | 'org_id' | 'created_at' | 'updated_at'>
  ) => {
    if (!orgId) {
      toast.error('No hay organización seleccionada')
      return
    }

    try {
      if (selectedThermalProfile) {
        // Update existing profile
        await thermalProfilesService.update(
          selectedThermalProfile.id,
          orgId,
          profile
        )
        toast.success('Perfil térmico actualizado correctamente')
      } else {
        // Create new profile
        await thermalProfilesService.create({
          ...profile,
          org_id: orgId,
        })
        toast.success('Perfil térmico creado correctamente')
      }

      setThermalProfileDialogOpen(false)
      setSelectedThermalProfile(undefined)
      loadThermalProfiles(true) // Force reload after save
    } catch (error) {
      console.error('Error guardando perfil térmico:', error)
      toast.error('Error al guardar el perfil térmico')
    }
  }

  const handleThermalProfileCreate = () => {
    setSelectedThermalProfile(undefined)
    setThermalProfileDialogOpen(true)
  }

  const handleThermalProfileDialogClose = () => {
    setThermalProfileDialogOpen(false)
    setSelectedThermalProfile(undefined)
    // Regresar a la ruta base si estamos en una sub-ruta
    if (window.location.pathname.includes('/settings/thermal-profiles/')) {
      navigate('/settings/thermal-profiles')
    }
  }

  // Load thermal profiles only when orgId changes (not on every mount)
  useEffect(() => {
    // Only load if orgId changed or hasn't been loaded yet
    if (orgId && (thermalProfilesLoadedOrgId !== orgId || thermalProfiles.length === 0)) {
      loadThermalProfiles()
    } else if (!orgId) {
      setThermalProfiles([])
      setThermalProfilesLoadedOrgId(null)
    }
  }, [orgId, thermalProfilesLoadedOrgId, thermalProfiles.length])

  return {
    // Data
    thermalProfiles,
    isLoading,

    // State
    selectedThermalProfile,
    thermalProfileDialogOpen,
    deleteThermalProfileDialogOpen,
    bulkDeleteThermalProfileDialogOpen,
    thermalProfileToAction,
    thermalProfilesToDelete,
    
    // Actions
    handleThermalProfileEdit,
    handleThermalProfileEditById,
    handleThermalProfileDelete,
    handleConfirmDeleteThermalProfile,
    handleThermalProfileReactivate,
    handleThermalProfileBulkDelete,
    handleConfirmBulkDeleteThermalProfile,
    handleThermalProfileSave,
    handleThermalProfileCreate,
    handleThermalProfileDialogClose,
    loadThermalProfiles,
    setDeleteThermalProfileDialogOpen,
    setBulkDeleteThermalProfileDialogOpen,
  }
}