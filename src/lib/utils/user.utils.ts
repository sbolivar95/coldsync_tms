/**
 * User utility functions for formatting and display
 */

/**
 * Format date helper
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return "-";
  }
};

/**
 * Format datetime helper
 */
export const formatDateTime = (dateString?: string): string => {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return "-";
  }
};

/**
 * Get user status badge CSS classes
 */
export const getUserStatusBadgeClass = (status: string): string => {
  switch (status) {
    case "Activo":
      return "bg-green-100 text-green-700 hover:bg-green-100 text-xs";
    case "Inactivo":
      return "bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs";
    case "Suspendido":
      return "bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs";
    default:
      return "bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs";
  }
};

/**
 * Get user status label (already in Spanish)
 */
export const getUserStatusLabel = (status: string): string => {
  return status;
};

