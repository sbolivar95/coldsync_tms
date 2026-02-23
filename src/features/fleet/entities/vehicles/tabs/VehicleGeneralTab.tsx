import type { Vehicle, FleetSet } from "../../../../../types/database.types";
import { VehicleGeneralForm } from "../components/VehicleGeneralForm";

interface VehicleGeneralTabProps {
  vehicle?: Vehicle | null;
  carrierId?: number;
  currentAssignment?: FleetSet | null;
}

export const VehicleGeneralTab = ({
  vehicle,
  currentAssignment,
}: VehicleGeneralTabProps) => {
  return (
    <VehicleGeneralForm
      vehicle={vehicle}
      currentAssignment={currentAssignment}
    />
  );
};

VehicleGeneralTab.displayName = "VehicleGeneralTab";
