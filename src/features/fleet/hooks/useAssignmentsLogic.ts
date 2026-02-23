import { useState, useEffect } from "react";
import { toast } from "sonner";
import { fleetSetsService } from "../../../services/database";
import type { FleetSet } from "../../../types/database.types";

interface UseAssignmentsLogicProps {
    organizationId: string | undefined;
    onRefresh: () => void;
}

export function useAssignmentsLogic({ organizationId, onRefresh }: UseAssignmentsLogicProps) {
    const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
    const [deleteAssignmentDialogOpen, setDeleteAssignmentDialogOpen] = useState(false);
    const [assignmentEditing, setAssignmentEditing] = useState<FleetSet | null>(null);
    const [assignmentToDelete, setAssignmentToDelete] = useState<FleetSet | null>(null);

    const handleEditAssignment = (assignment: FleetSet) => {
        setAssignmentEditing(assignment);
        setAssignmentDialogOpen(true);
    };

    const handleDeleteAssignmentConfirm = (assignment: FleetSet) => {
        setAssignmentToDelete(assignment);
        setDeleteAssignmentDialogOpen(true);
    };

    const handleSaveAssignment = async () => {
        setAssignmentDialogOpen(false);
        setAssignmentEditing(null);
        onRefresh();
    };

    const handleDeleteAssignment = async () => {
        if (!organizationId || !assignmentToDelete) return;

        try {
            if (assignmentToDelete.is_active && !assignmentToDelete.ends_at) {
                await fleetSetsService.end(assignmentToDelete.id, organizationId);
                toast.success("Asignación finalizada correctamente");
            } else {
                await fleetSetsService.delete(assignmentToDelete.id, organizationId);
                toast.success("Asignación eliminada correctamente");
            }
            setDeleteAssignmentDialogOpen(false);
            setAssignmentToDelete(null);
            onRefresh();
        } catch (error) {
            console.error("Error deleting assignment:", error);
            toast.error("Error al eliminar la asignación");
        }
    };

    // Add event listener for create assignment
    useEffect(() => {
        const handleCreateAssignment = () => {
            setAssignmentEditing(null);
            setAssignmentDialogOpen(true);
        };
        window.addEventListener('createAssignment', handleCreateAssignment);
        return () => window.removeEventListener('createAssignment', handleCreateAssignment);
    }, []);

    return {
        // State
        assignmentDialogOpen,
        setAssignmentDialogOpen,
        deleteAssignmentDialogOpen,
        setDeleteAssignmentDialogOpen,
        assignmentEditing,
        setAssignmentEditing,
        assignmentToDelete,

        // Handlers
        handleEditAssignment,
        handleDeleteAssignmentConfirm,
        handleSaveAssignment,
        handleDeleteAssignment
    };
}
