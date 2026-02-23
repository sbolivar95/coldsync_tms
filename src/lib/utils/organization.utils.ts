/**
 * Organization utility functions for formatting and display
 */

import { formatDate, formatDateTime } from './user.utils'

/**
 * Re-export date formatting functions
 */
export { formatDate, formatDateTime }

/**
 * Get organization status badge CSS classes
 * Database status: 'ACTIVE' | 'INACTIVE'
 */
export const getOrganizationStatusBadgeClass = (status: string): string => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-700 hover:bg-green-100 text-xs";
    case "INACTIVE":
      return "bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs";
    default:
      return "bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs";
  }
};

/**
 * Get organization status label in Spanish
 * Database status: 'ACTIVE' | 'INACTIVE'
 */
export const getOrganizationStatusLabel = (status: string): string => {
  switch (status) {
    case "ACTIVE":
      return "Activo";
    case "INACTIVE":
      return "Inactivo";
    default:
      return status;
  }
};

/**
 * Get plan type label in Spanish
 */
export const getPlanTypeLabel = (planType: string): string => {
  switch (planType) {
    case "STARTER":
      return "Starter";
    case "PROFESSIONAL":
      return "Professional";
    default:
      return planType;
  }
};

/**
 * Format tax ID for display (mask sensitive information)
 */
export const formatTaxId = (taxId: string): string => {
  if (!taxId) return "-";
  
  // Show first 3 and last 3 characters, mask the middle
  if (taxId.length <= 6) {
    return taxId; // Show full tax ID if it's short
  }
  
  const start = taxId.substring(0, 3);
  const end = taxId.substring(taxId.length - 3);
  const middle = "*".repeat(Math.max(0, taxId.length - 6));
  
  return `${start}${middle}${end}`;
};

/**
 * Format contact email for display (truncate if too long)
 */
export const formatContactEmail = (email: string): string => {
  if (!email) return "-";
  
  // Truncate long emails for table display
  if (email.length > 25) {
    return `${email.substring(0, 22)}...`;
  }
  
  return email;
};

