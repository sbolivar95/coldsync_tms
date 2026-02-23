
import { useMemo, useEffect, useCallback } from "react";
import type { OrdersContextualFilterValue } from "../../../components/ui/OrdersContextualFilter";
import { useAppStore } from "../../../stores/useAppStore";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";
import { ordersService, CarrierOrder, CARRIER_ORDER_STATUSES, CarrierOrderCategory } from "../../../services/database/orders.service";

export interface UseOrdersProps {
    activeTab: string;
    searchValue: string;
    contextualFilter?: OrdersContextualFilterValue;
}

export interface UseOrdersReturn {
    searchedOrders: CarrierOrder[];
    counts: {
        solicitudes: number;
        compromisos: number;
        historial: number;
    };
    isLoading: boolean;
    handleQuickAccept: (order: CarrierOrder) => void;
    handleQuickReject: (order: CarrierOrder) => void;
    handleBulkAccept: (orderIds: string[]) => void;
    handleBulkReject: (orderIds: string[], reason: string, comments?: string) => void;
    handleRowClick: (order: CarrierOrder) => void;
    handleOrderEdit: (updatedOrder: Partial<CarrierOrder> & { id: string }) => void;
    handleAccept: (orderId: string) => void;
    handleAcceptWithChanges: (orderId: string, newFleetSetId: string, reason?: string) => void;
    handleReject: (orderId: string, reason: string) => void;
    handleFailAfterAccept: (orderId: string, reason: string, comments: string) => Promise<void>;
    loadOrders: (force?: boolean) => Promise<void>;
    getTimeRemaining: (order: CarrierOrder) => { hoursRemaining: number; isExpired: boolean; isUrgent: boolean };
}

export function useOrders({
    activeTab,
    searchValue,
    contextualFilter = "all",
}: UseOrdersProps): UseOrdersReturn {
    // Get user info from store
    const {
        orders,
        isLoading,
        ordersLoadedOrgId,
        organization,
        organizationMember,
        user,
        setOrders,
        setOrdersLoading,
        setOrdersLoadedOrgId,
        updateOrderInStore
    } = useAppStore(
        useShallow((state) => ({
            orders: state.orders as unknown as CarrierOrder[],
            isLoading: state.ordersLoading,
            ordersLoadedOrgId: state.ordersLoadedOrgId,
            organization: state.organization,
            organizationMember: state.organizationMember,
            user: state.user,
            setOrders: state.setOrders,
            setOrdersLoading: state.setOrdersLoading,
            setOrdersLoadedOrgId: state.setOrdersLoadedOrgId,
            updateOrderInStore: state.updateOrderInStore
        }))
    );

    const orgId = organization?.id;
    const carrierId = organizationMember?.carrier_id;
    const userId = user?.id;

    // Load orders from Supabase
    const loadOrders = useCallback(async (force = false) => {
        if (!orgId || !carrierId) {
            console.warn('Cannot load orders: missing orgId or carrierId');
            return;
        }

        const dependency = `${orgId}-${carrierId}`;

        if (!force && ordersLoadedOrgId === dependency && orders.length > 0) {
            return;
        }

        try {
            setOrdersLoading(true);
            const fetchedOrders = await ordersService.getCarrierOrders(carrierId, orgId);
            setOrders(fetchedOrders as any);
            setOrdersLoadedOrgId(dependency);
        } catch (error) {
            console.error('Error loading orders:', error);
            toast.error('Error al cargar las órdenes');
            setOrders([]);
            setOrdersLoadedOrgId(null);
        } finally {
            setOrdersLoading(false);
        }
    }, [orgId, carrierId, ordersLoadedOrgId, orders.length, setOrders, setOrdersLoading, setOrdersLoadedOrgId]);

    // Load orders on mount and subscribe to real-time updates
    useEffect(() => {
        loadOrders();

        // Subscribe to real-time updates
        if (orgId && carrierId) {
            const unsubscribe = ordersService.subscribeToCarrierOrders(
                carrierId,
                orgId,
                (payload) => {
                    console.log('Realtime update:', payload.eventType);
                    // Refresh orders on any change
                    loadOrders(true);
                }
            );

            return () => {
                unsubscribe();
            };
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgId, carrierId]);

    // Filter orders by tab (category)
    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const status = order.status;
            const category = activeTab as CarrierOrderCategory;
            
            if (category === "solicitudes") {
                return CARRIER_ORDER_STATUSES.SOLICITUDES.includes(status as any);
            }
            if (category === "compromisos") {
                return CARRIER_ORDER_STATUSES.COMPROMISOS.includes(status as any);
            }
            if (category === "historial") {
                return CARRIER_ORDER_STATUSES.HISTORIAL.includes(status as any);
            }
            return true;
        });
    }, [orders, activeTab]);

    // Filter by search and contextual filter
    const searchedOrders = useMemo(() => {
        let filtered = filteredOrders;

        if (contextualFilter !== "all") {
            filtered = filtered.filter((order) => {
                const plannedStart = new Date(order.planned_start_at);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (activeTab === "solicitudes" || activeTab === "compromisos") {
                    switch (contextualFilter) {
                        case "today":
                            return plannedStart.toDateString() === today.toDateString();
                        case "tomorrow":
                            const tomorrow = new Date(today);
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            return plannedStart.toDateString() === tomorrow.toDateString();
                        case "this_week":
                            const weekEnd = new Date(today);
                            weekEnd.setDate(weekEnd.getDate() + 7);
                            return plannedStart >= today && plannedStart <= weekEnd;
                        case "upcoming":
                            return plannedStart > today;
                        default:
                            return true;
                    }
                } else if (activeTab === "historial") {
                    const status = order.status;
                    switch (contextualFilter) {
                        case "rejected":
                            return status === "REJECTED";
                        case "expired":
                            return false; // No explicit EXPIRED status in DB
                        case "observed":
                            return status === "OBSERVANCE";
                        case "dispatched":
                            return status === "DISPATCHED" || status === "COMPLETED";
                        default:
                            return true;
                    }
                }

                return true;
            });
        }

        return filtered.filter((order) => {
            if (!searchValue) return true;
            const search = searchValue.toLowerCase();
            
            // Search in lane name, dispatch number, locations
            const laneName = order.lane?.name || '';
            const dispatchNumber = order.dispatch_number || '';
            const originLocation = order.lane?.lane_stops?.find(s => s.stop_type === 'PICKUP')?.location?.name || '';
            const destLocation = order.lane?.lane_stops?.find(s => s.stop_type === 'DROP_OFF')?.location?.name || '';
            const productName = order.items?.[0]?.product?.name || '';

            return (
                order.id?.toLowerCase().includes(search) ||
                dispatchNumber.toLowerCase().includes(search) ||
                laneName.toLowerCase().includes(search) ||
                originLocation.toLowerCase().includes(search) ||
                destLocation.toLowerCase().includes(search) ||
                productName.toLowerCase().includes(search)
            );
        });
    }, [filteredOrders, searchValue, contextualFilter, activeTab]);

    // Count orders by category
    const counts = useMemo(() => {
        return {
            solicitudes: orders.filter(o => 
                CARRIER_ORDER_STATUSES.SOLICITUDES.includes(o.status as any)
            ).length,
            compromisos: orders.filter(o => 
                CARRIER_ORDER_STATUSES.COMPROMISOS.includes(o.status as any)
            ).length,
            historial: orders.filter(o => 
                CARRIER_ORDER_STATUSES.HISTORIAL.includes(o.status as any)
            ).length,
        };
    }, [orders]);

    // Handle quick accept
    const handleQuickAccept = async (order: CarrierOrder) => {
        if (!order.id || !userId) return;
        
        try {
            await ordersService.acceptOrder(order.id, userId);
            toast.success("Orden aceptada correctamente");
            loadOrders(true);
        } catch (error) {
            console.error('Error accepting order:', error);
            toast.error('Error al aceptar la orden');
        }
    };

    // Handle quick reject
    const handleQuickReject = async (order: CarrierOrder) => {
        if (!order.id || !userId) return;
        
        try {
            await ordersService.rejectOrder(order.id, userId, undefined, orgId ?? undefined, carrierId ?? undefined);
            toast.success("Orden rechazada correctamente");
            loadOrders(true);
        } catch (error) {
            console.error('Error rejecting order:', error);
            toast.error('Error al rechazar la orden');
        }
    };

    // Handle bulk accept
    const handleBulkAccept = async (orderIds: string[]) => {
        if (!userId) return;
        
        try {
            await Promise.all(orderIds.map(id => ordersService.acceptOrder(id, userId)));
            toast.success(`${orderIds.length} órdenes aceptadas correctamente`);
            loadOrders(true);
        } catch (error) {
            console.error('Error bulk accepting orders:', error);
            toast.error('Error al aceptar las órdenes');
        }
    };

    // Handle bulk reject
    const handleBulkReject = async (orderIds: string[], reason: string, comments?: string) => {
        if (!userId) return;
        
        try {
            const commentsText = comments ? `: ${comments}` : '';
            const fullReason = `${reason}${commentsText}`;
            await Promise.all(orderIds.map(id => ordersService.rejectOrder(id, userId, fullReason, orgId ?? undefined, carrierId ?? undefined)));
            toast.success(`${orderIds.length} órdenes rechazadas correctamente`);
            loadOrders(true);
        } catch (error) {
            console.error('Error bulk rejecting orders:', error);
            toast.error('Error al rechazar las órdenes');
        }
    };

    // Handle row click
    const handleRowClick = (order: CarrierOrder) => {
        console.log("Row clicked:", order.id);
    };

    // Handle order edit
    const handleOrderEdit = (updatedOrder: Partial<CarrierOrder> & { id: string }) => {
        updateOrderInStore(updatedOrder.id, updatedOrder as any);
    };

    // Handle accept
    const handleAccept = async (orderId: string) => {
        if (!userId) return;
        
        try {
            await ordersService.acceptOrder(orderId, userId);
            toast.success("Orden aceptada correctamente");
            loadOrders(true);
        } catch (error) {
            console.error('Error accepting order:', error);
            toast.error('Error al aceptar la orden');
        }
    };

    // Handle accept with changes (fleet set change)
    const handleAcceptWithChanges = async (orderId: string, newFleetSetId: string, reason?: string) => {
        if (!userId) return;
        
        try {
            await ordersService.acceptOrderWithChanges(orderId, userId, newFleetSetId, reason);
            toast.success("Orden aceptada con cambios correctamente");
            loadOrders(true);
        } catch (error) {
            console.error('Error accepting order with changes:', error);
            toast.error('Error al aceptar la orden con cambios');
        }
    };

    // Handle reject
    const handleReject = async (orderId: string, reason: string) => {
        if (!userId) return;
        
        try {
            await ordersService.rejectOrder(orderId, userId, reason, orgId ?? undefined, carrierId ?? undefined);
            toast.success("Orden rechazada correctamente");
            loadOrders(true);
        } catch (error) {
            console.error('Error rejecting order:', error);
            toast.error('Error al rechazar la orden');
        }
    };

    // Get time remaining for an order
    const getTimeRemaining = (order: CarrierOrder) => {
        return ordersService.calculateTimeRemaining(order);
    };

    const handleFailAfterAccept = async (orderId: string, reason: string, comments: string) => {
        if (!userId) return;

        try {
            const fullReason = comments ? `${reason}: ${comments}` : reason;
            await ordersService.rejectOrder(orderId, userId, fullReason, orgId ?? undefined, carrierId ?? undefined);
            toast.success("Falla post-aceptación registrada correctamente");
            loadOrders(true);
        } catch (error) {
            console.error('Error failing order after accept:', error);
            toast.error('Error al registrar la falla post-aceptación');
        }
    };

    return {
        searchedOrders,
        counts,
        isLoading,
        handleQuickAccept,
        handleQuickReject,
        handleBulkAccept,
        handleBulkReject,
        handleRowClick,
        handleOrderEdit,
        handleAccept,
        handleAcceptWithChanges,
        handleReject,
        handleFailAfterAccept,
        loadOrders,
        getTimeRemaining
    };
}
