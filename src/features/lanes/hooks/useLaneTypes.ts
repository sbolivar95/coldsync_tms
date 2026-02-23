import { useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { laneTypesService } from '../../../services/database/lanes.service'
import type { SmartOption } from '../../../components/widgets/SmartSelect'
import { useAppStore } from '../../../stores/useAppStore'
import { useShallow } from 'zustand/react/shallow'

/**
 * Hook for loading and managing lane types data with Zustand store
 */
export function useLaneTypes(organizationId?: string) {
    const {
        laneTypesData,
        loading,
        loadedOrgId,
        setLaneTypes,
        setLoading,
        setLoadedOrgId
    } = useAppStore(
        useShallow((state) => ({
            laneTypesData: state.laneTypes,
            loading: state.laneTypesLoading,
            loadedOrgId: state.laneTypesLoadedOrgId,
            setLaneTypes: state.setLaneTypes,
            setLoading: state.setLaneTypesLoading,
            setLoadedOrgId: state.setLaneTypesLoadedOrgId
        }))
    )

    const loadLaneTypes = useCallback(async (force = false) => {
        if (!organizationId) {
            setLaneTypes([])
            setLoadedOrgId(null)
            return
        }

        if (!force && loadedOrgId === organizationId && laneTypesData.length > 0) {
            return
        }

        try {
            setLoading(true)
            const typesData = await laneTypesService.getAll(organizationId)
            setLaneTypes(typesData)
            setLoadedOrgId(organizationId)
        } catch (error) {
            console.error('Error loading lane types:', error)
            toast.error('Error al cargar los tipos de carril')
            setLaneTypes([])
            setLoadedOrgId(null)
        } finally {
            setLoading(false)
        }
    }, [organizationId, loadedOrgId, laneTypesData.length, setLaneTypes, setLoading, setLoadedOrgId])

    const createLaneType = async (data: { name: string, description?: string | null }) => {
        if (!organizationId) return

        try {
            setLoading(true)
            await laneTypesService.create({
                org_id: organizationId,
                name: data.name,
                description: data.description || null,
            })
            toast.success('Tipo de carril creado correctamente')
            await loadLaneTypes(true)
        } catch (error) {
            console.error('Error creating lane type:', error)
            toast.error('Error al crear el tipo de carril')
            throw error
        } finally {
            setLoading(false)
        }
    }

    const updateLaneType = async (id: number, data: { name: string, description?: string | null }) => {
        if (!organizationId) return

        try {
            setLoading(true)
            await laneTypesService.update(id, organizationId, {
                name: data.name,
                description: data.description || null,
            })
            toast.success('Tipo de carril actualizado correctamente')
            await loadLaneTypes(true)
        } catch (error) {
            console.error('Error updating lane type:', error)
            toast.error('Error al actualizar el tipo de carril')
            throw error
        } finally {
            setLoading(false)
        }
    }

    const deleteLaneType = async (id: number) => {
        if (!organizationId) return

        try {
            setLoading(true)
            await laneTypesService.delete(id, organizationId)
            toast.success('Tipo de carril eliminado correctamente')
            await loadLaneTypes(true)
        } catch (error) {
            console.error('Error deleting lane type:', error)
            if ((error as any).code === '23503') {
                toast.error('No se puede eliminar un tipo de carril que está siendo utilizado')
            } else {
                toast.error('Error al eliminar el tipo de carril')
            }
            throw error
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (organizationId && (loadedOrgId !== organizationId || laneTypesData.length === 0)) {
            loadLaneTypes()
        } else if (!organizationId) {
            setLaneTypes([])
            setLoadedOrgId(null)
        }
    }, [organizationId, loadedOrgId, laneTypesData.length, loadLaneTypes, setLaneTypes, setLoadedOrgId])

    // Derived options for SmartSelect
    const laneTypesOptions: SmartOption[] = laneTypesData.map((type) => ({
        value: type.id.toString(),
        label: type.name,
    }))

    return {
        laneTypes: laneTypesOptions,
        laneTypesData,
        loading,
        loadLaneTypes,
        createLaneType,
        updateLaneType,
        deleteLaneType
    }
}
