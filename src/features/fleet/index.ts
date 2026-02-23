// Main components
export { FleetList } from "./components/FleetList";

// Shared components
export { CurrentAssignmentCard } from "./components/CurrentAssignmentCard";

// Entity components (using index.ts for cleaner imports)
export { VehicleDetail, VehiclesList, useVehicles } from "./entities/vehicles";
export { DriverDetail, DriversList, useDrivers } from "./entities/drivers";
export { TrailerDetail, TrailersList, CompartmentDialog, useTrailers } from "./entities/trailers";
export { HardwareDetail, HardwareList, useHardware } from "./entities/hardware";
export { AssignmentDialog, AssignmentConfirmationDialog } from "./entities/assignments";
