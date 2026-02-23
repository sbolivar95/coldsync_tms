import { useState, useEffect } from "react";
import { useOrders } from "./hooks/useOrders";
import { OrdersTable } from "./components/OrdersTable";
import { OrderDrawer } from "./components/drawer/OrderDrawer";
import { BulkDeclineDialog } from "./components/dialogs/BulkDeclineDialog";
import { BulkAcceptDialog } from "./components/dialogs/BulkAcceptDialog";
import { FailAfterAcceptDialog } from "./components/dialogs/FailAfterAcceptDialog";
import { CarrierOrder, ordersService, type RejectionReason } from "../../services/database/orders.service";

interface OrdersListProps {
    orders: ReturnType<typeof useOrders>;
    activeTab: string;
}

export function OrdersList({ orders, activeTab }: OrdersListProps) {
    const {
        searchedOrders,
        handleBulkAccept,
        handleBulkReject,
        handleAccept,
        handleAcceptWithChanges,
        handleReject,
        handleFailAfterAccept,
        isLoading
    } = orders;

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<CarrierOrder | null>(null);
    const [bulkDeclineDialogOpen, setBulkDeclineDialogOpen] = useState(false);
    const [ordersToBulkDecline, setOrdersToBulkDecline] = useState<string[]>([]);
    const [bulkAcceptDialogOpen, setBulkAcceptDialogOpen] = useState(false);
    // @ts-ignore - fixing type mismatch
    const [ordersToBulkAccept, setOrdersToBulkAccept] = useState<CarrierOrder[]>([]);
    const [failAfterAcceptDialogOpen, setFailAfterAcceptDialogOpen] = useState(false);
    const [orderToFailAfterAccept, setOrderToFailAfterAccept] = useState<CarrierOrder | null>(null);
    const [rejectionReasons, setRejectionReasons] = useState<RejectionReason[]>([]);
    const [postAcceptanceReasons, setPostAcceptanceReasons] = useState<RejectionReason[]>([]);

    // Pre-load rejection reasons once on mount
    useEffect(() => {
        const loadReasons = async () => {
            try {
                const [reasons, postReasons] = await Promise.all([
                    ordersService.getRejectionReasons(),
                    ordersService.getRejectionReasons('post_acceptance')
                ]);
                setRejectionReasons(reasons);
                setPostAcceptanceReasons(postReasons);
            } catch (error) {
                console.error("Failed to load rejection reasons", error);
            }
        };
        loadReasons();
    }, []);

    const handleRowClick = (order: CarrierOrder) => {
        setSelectedOrder(order);
        setDrawerOpen(true);
    };

    // Handle bulk decline - open dialog (from bulk action toolbar)
    const handleBulkDeclineClick = (orderIds: string[]) => {
        setOrdersToBulkDecline(orderIds);
        setBulkDeclineDialogOpen(true);
    };

    // Handle single decline - open dialog (from context menu)
    const handleSingleDeclineClick = (order: CarrierOrder) => {
        if (order.id) {
            setOrdersToBulkDecline([order.id]);
            setBulkDeclineDialogOpen(true);
        }
    };

    // Handle bulk accept - open dialog (from bulk action toolbar)
    const handleBulkAcceptClick = (orderIds: string[]) => {
        const ordersToAccept = searchedOrders.filter(order => orderIds.includes(order.id || ""));
        setOrdersToBulkAccept(ordersToAccept);
        setBulkAcceptDialogOpen(true);
    };

    // Handle single accept - open dialog (from context menu)
    const handleSingleAcceptClick = (order: CarrierOrder) => {
        // If order has no fleet set, open drawer to allow assignment
        if (!order.fleet_set_id) {
            setSelectedOrder(order);
            setDrawerOpen(true);
            return;
        }

        setOrdersToBulkAccept([order]);
        setBulkAcceptDialogOpen(true);
    };

    // Handle bulk accept confirmation
    const handleBulkAcceptConfirm = () => {
        const orderIds = ordersToBulkAccept.map(order => order.id || "").filter(id => id);
        handleBulkAccept(orderIds);
        
        // Reset state
        setOrdersToBulkAccept([]);
        setBulkAcceptDialogOpen(false);
    };

    // Handle fail after accept - open dialog (from context menu)
    const handleFailAfterAcceptClick = (order: CarrierOrder) => {
        setOrderToFailAfterAccept(order);
        setFailAfterAcceptDialogOpen(true);
    };

    // Handle fail after accept confirmation
    const handleFailAfterAcceptConfirm = async (reason: string, comments: string) => {
        if (orderToFailAfterAccept?.id) {
            await handleFailAfterAccept(orderToFailAfterAccept.id, reason, comments);
        }
        
        // Reset state
        setOrderToFailAfterAccept(null);
        setFailAfterAcceptDialogOpen(false);
    };

    // Handle bulk decline confirmation
    const handleBulkDeclineConfirm = (reason: string, comments: string) => {
        // Call the actual bulk reject handler with reason and comments
        handleBulkReject(ordersToBulkDecline, reason, comments);
        
        // Reset state
        setOrdersToBulkDecline([]);
        setBulkDeclineDialogOpen(false);
    };

    const timestamps = selectedOrder ? {
        tenderCreatedAt: selectedOrder.carrier_assigned_at || selectedOrder.created_at,
        decisionTimestamp: selectedOrder.updated_at || undefined
    } : { tenderCreatedAt: undefined, decisionTimestamp: undefined };

    return (
        <>
            <OrdersTable
                orders={searchedOrders}
                // @ts-ignore
                onRowClick={handleRowClick}
                onQuickAccept={handleBulkAcceptClick}
                onQuickReject={handleBulkDeclineClick}
                // @ts-ignore
                onAcceptOrder={handleSingleAcceptClick}
                // @ts-ignore
                onRejectOrder={handleSingleDeclineClick}
                onFailAfterAccept={handleFailAfterAcceptClick}
                activeTab={activeTab}
            />
            {drawerOpen && selectedOrder && (
                <OrderDrawer
                    open={drawerOpen}
                    onOpenChange={setDrawerOpen}
                    order={selectedOrder}
                    tenderCreatedAt={timestamps.tenderCreatedAt}
                    decisionTimestamp={timestamps.decisionTimestamp}
                    isLoading={isLoading}
                    onFailAfterAccept={(reason, comments) => {
                        if (selectedOrder.id) {
                            handleFailAfterAccept(selectedOrder.id, reason, comments);
                        }
                    }}
                    onAccept={handleAccept}
                    onAcceptWithChanges={handleAcceptWithChanges}
                    onReject={handleReject}
                />
            )}
            <BulkDeclineDialog
                open={bulkDeclineDialogOpen}
                onOpenChange={(open) => {
                    setBulkDeclineDialogOpen(open);
                    if (!open) setOrdersToBulkDecline([]);
                }}
                reasons={rejectionReasons}
                orderCount={ordersToBulkDecline.length}
                onConfirm={handleBulkDeclineConfirm}
            />
            <BulkAcceptDialog
                open={bulkAcceptDialogOpen}
                onOpenChange={(open) => {
                    setBulkAcceptDialogOpen(open);
                    if (!open) setOrdersToBulkAccept([]);
                }}
                // @ts-ignore
                orders={ordersToBulkAccept}
                onConfirm={handleBulkAcceptConfirm}
            />
            <FailAfterAcceptDialog
                open={failAfterAcceptDialogOpen}
                onOpenChange={(open) => {
                    setFailAfterAcceptDialogOpen(open);
                    if (!open) setOrderToFailAfterAccept(null);
                }}
                // @ts-ignore
                order={orderToFailAfterAccept}
                reasons={postAcceptanceReasons}
                onConfirm={handleFailAfterAcceptConfirm}
            />
        </>
    );
}