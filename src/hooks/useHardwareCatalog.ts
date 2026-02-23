import { useEffect } from 'react'
import { useAppStore } from '../stores/useAppStore'
import { hardwareService } from '../services/database/hardware.service'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'

export function useHardwareCatalog() {
    const {
        protocols,
        protocolsLoading,
        protocolsLoaded,
        setProtocols,
        setProtocolsLoading,
        setProtocolsLoaded,
        deviceTypes,
        deviceTypesLoading,
        deviceTypesLoaded,
        setDeviceTypes,
        setDeviceTypesLoading,
        setDeviceTypesLoaded,
    } = useAppStore(
        useShallow((state) => ({
            protocols: state.flespiProtocols,
            protocolsLoading: state.flespiProtocolsLoading,
            protocolsLoaded: state.flespiProtocolsLoaded,
            setProtocols: state.setFlespiProtocols,
            setProtocolsLoading: state.setFlespiProtocolsLoading,
            setProtocolsLoaded: state.setFlespiProtocolsLoaded,
            deviceTypes: state.flespiDeviceTypes,
            deviceTypesLoading: state.flespiDeviceTypesLoading,
            deviceTypesLoaded: state.flespiDeviceTypesLoaded,
            setDeviceTypes: state.setFlespiDeviceTypes,
            setDeviceTypesLoading: state.setFlespiDeviceTypesLoading,
            setDeviceTypesLoaded: state.setFlespiDeviceTypesLoaded,
        }))
    )

    // Load Protocols (Universal Cache Pattern)
    useEffect(() => {
        const loadProtocols = async () => {
            if (protocolsLoaded || protocolsLoading) return

            try {
                setProtocolsLoading(true)
                const data = await hardwareService.getFlespiProtocols()
                setProtocols(data)
                setProtocolsLoaded(true)
            } catch (error) {
                console.error('Error loading hardware protocols:', error)
                toast.error('Error al cargar catálogo de hardware')
            } finally {
                setProtocolsLoading(false)
            }
        }

        loadProtocols()
    }, [protocolsLoaded, protocolsLoading, setProtocols, setProtocolsLoaded, setProtocolsLoading])

    // Load Device Types (Universal Cache Pattern)
    // We load ALL types initially for client-side filtering. 
    // If the list grows too large, we should switch to on-demand loading by protocol.
    useEffect(() => {
        const loadDeviceTypes = async () => {
            if (deviceTypesLoaded || deviceTypesLoading) return

            try {
                setDeviceTypesLoading(true)
                const data = await hardwareService.getFlespiDeviceTypes() // No param = get all
                setDeviceTypes(data)
                setDeviceTypesLoaded(true)
            } catch (error) {
                console.error('Error loading hardware device types:', error)
                // Silent fail or toast? Toast is better for visibility
                toast.error('Error al cargar tipos de dispositivos')
            } finally {
                setDeviceTypesLoading(false)
            }
        }

        loadDeviceTypes()
    }, [deviceTypesLoaded, deviceTypesLoading, setDeviceTypes, setDeviceTypesLoaded, setDeviceTypesLoading])

    const refresh = async () => {
        try {
            setProtocolsLoading(true)
            setDeviceTypesLoading(true)

            const [pData, dtData] = await Promise.all([
                hardwareService.getFlespiProtocols(),
                hardwareService.getFlespiDeviceTypes()
            ])

            setProtocols(pData)
            setDeviceTypes(dtData)
            setProtocolsLoaded(true)
            setDeviceTypesLoaded(true)
        } catch (error) {
            console.error('Error refreshing hardware catalog:', error)
            toast.error('Error al refrescar catálogo')
        } finally {
            setProtocolsLoading(false)
            setDeviceTypesLoading(false)
        }
    }

    return {
        protocols,
        deviceTypes,
        loading: protocolsLoading || deviceTypesLoading,
        loaded: protocolsLoaded && deviceTypesLoaded,
        refresh
    }
}
