import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { DispatchOrderDetail } from "../../features/dispatch";
import { useDispatchOrders } from "../../features/dispatch/hooks/useDispatchOrders";
import { useAppStore } from "../../stores/useAppStore";

export function DispatchOrderCreatePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const setBreadcrumbs = useAppStore((state) => state.setBreadcrumbs);
    const organization = useAppStore((state) => state.organization);
    const { loadDispatchOrders } = useDispatchOrders(organization?.id);

    // Get the previous view from location state, or use current preference
    const dispatchViewPreference = useAppStore((state) => state.dispatchViewPreference);
    const previousView = (location.state as { from?: string })?.from || `/dispatch/${dispatchViewPreference}`;

    useEffect(() => {
        setBreadcrumbs(location.pathname, [
            {
                label: "Despacho",
                onClick: () => navigate(previousView),
            },
            {
                label: "Nueva Orden",
                onClick: undefined,
            },
        ]);
    }, [location.pathname, setBreadcrumbs, navigate, previousView]);

    const handleBack = () => {
        navigate(previousView);
    };

    const handleSave = async () => {
        await loadDispatchOrders(true);
        navigate(previousView);
    };

    return (
        <DispatchOrderDetail
            onBack={handleBack}
            onSave={handleSave}
        />
    );
}
