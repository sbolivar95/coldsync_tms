/**
 * User type for UI components
 * This type represents a user as displayed in the application
 */
export interface User {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string; // Can be enum value (OWNER, ADMIN, STAFF, DRIVER) or Spanish label
  status: "Activo" | "Inactivo" | "Suspendido";
  phone: string;
  organizationId?: string;
  createdAt?: string;
  invitationCode?: string;
  invitationExpiresAt?: string;
  // Carrier member fields
  isCarrierMember?: boolean;
  carrierId?: number | null;
  driverId?: number | null;
  // Legacy Spanish field names (for backward compatibility during migration)
  nombre?: string;
  apellido?: string;
  correo?: string;
  rol?: string;
  estado?: string;
  telefono?: string;
  creado?: string;
  codigoInvitacion?: string;
  fechaExpiracionInvitacion?: string;
}


