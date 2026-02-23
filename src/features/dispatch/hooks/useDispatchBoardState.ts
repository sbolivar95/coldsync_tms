import { useState } from 'react'
import type { DispatchOrderWithRelations } from './useDispatchOrders'

interface UseDispatchBoardStateProps {
    dispatchOrders: DispatchOrderWithRelations[]
    loadDispatchOrders: (force?: boolean) => Promise<void>
    loadFleetSets: () => Promise<void>
    deleteDispatchOrder: (orderId: string) => Promise<void>
}

export function useDispatchBoardState({
    dispatchOrders,
    loadDispatchOrders,
    loadFleetSets,
    deleteDispatchOrder,
}: UseDispatchBoardStateProps) {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<DispatchOrderWithRelations | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [configurationFilter, setConfigurationFilter] = useState<'all' | 'Standard' | 'Hybrid'>('all')

    const handleOrderEdit = (_updatedOrder: DispatchOrderWithRelations) => {
        loadDispatchOrders(true)
        loadFleetSets()
    }

    const handleOrderDelete = async (orderId: string) => {
        try {
            await deleteDispatchOrder(orderId)
            loadDispatchOrders(true)
            loadFleetSets()
            if (selectedOrder?.id === orderId) {
                setDrawerOpen(false)
                setSelectedOrder(null)
            }
        } catch {
            // Handled by service
        }
    }

    const handleSearch = (searchValue: string) => {
        setSearchTerm(searchValue)
    }

    return {
        drawerOpen,
        setDrawerOpen,
        selectedOrder,
        setSelectedOrder,
        searchTerm,
        configurationFilter,
        setConfigurationFilter,
        handleOrderEdit,
        handleOrderDelete,
        handleSearch,
    }
}
