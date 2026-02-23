import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../../components/ui/Dialog";
import { toast } from "sonner";
import { Input } from "../../../../components/ui/Input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../../components/ui/Form";
import { SmartSelect } from "../../../../components/widgets/SmartSelect";
import { DialogActions } from "../../../../components/widgets/DialogActions";
import type { User } from "../../../../types/user.types";
import { type Organization, roleOptions } from "../../../../lib/mockData";
import { userSchema, type UserFormData } from "../../../../lib/schemas/user.schemas";
import { UserPlus, Edit, ChevronLeft, Key } from "lucide-react";
import { useAppStore } from "../../../../stores/useAppStore";
import type { UserRole, Driver } from "../../../../types/database.types";
import { getAvailableRolesForAssignment, mapStringToUserRole } from "../../../../lib/permissions";
import { UserCredentialsFields } from "./components/UserCredentialsFields";
import { Button } from "../../../../components/ui/Button";
import { cn } from "../../../../lib/utils";
import { Checkbox } from "../../../../components/ui/Checkbox";
import { useActiveCarriers } from "../../../carriers/hooks/useCarriers";
import { driversService } from "../../../../services/database/drivers.service";

interface UserDialogProps {
  open: boolean;
  onClose: () => void;
  user?: User;
  organizations: Organization[];
  onSave: (user: User) => void;
  isPlatformUser?: boolean;
  currentOrgId?: string;
  step?: 'form' | 'credentials';
  credentials?: {
    email: string;
    password: string;
  };
  onBackToForm?: () => void;
}

export function UserDialog({
  open,
  onClose,
  user,
  onSave,
  currentOrgId,
  isPlatformUser,
  step = 'form',
  credentials,
  onBackToForm
}: UserDialogProps) {
  const { user: currentUser, organizationMember, organization } = useAppStore();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);
  
  // Get carriers for dropdown
  const { carriers, isLoading: carriersLoading } = useActiveCarriers(organization?.id);

  // Check if editing own profile
  const isEditingSelf = user?.id && currentUser?.id &&
    (user.email === currentUser.email ||
      (organizationMember?.user_id === currentUser.id && user.id === organizationMember?.id));

  // Get available roles based on current user's role hierarchy
  const availableRoles = useMemo(() => {
    const allowedRoles = getAvailableRolesForAssignment(
      organizationMember?.role,
      isPlatformUser || false
    );
    // Map to roleOptions format
    return roleOptions.filter(option =>
      allowedRoles.includes(option.value as UserRole)
    );
  }, [organizationMember?.role, isPlatformUser]);

  // Get default role (first available role, or STAFF as fallback)
  const defaultRole = useMemo(() => {
    const role = availableRoles.length > 0 ? availableRoles[0].value : "STAFF";
    return role as "OWNER" | "ADMIN" | "STAFF" | "DRIVER";
  }, [availableRoles]);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: defaultRole,
      organizationId: currentOrgId || "", // Default to current org if not provided
      isCarrierMember: false,
      carrierId: null,
      driverId: null,
    },
  });

  // Watch carrier member and carrier selection for conditional rendering
  const isCarrierMember = form.watch('isCarrierMember');
  const selectedCarrierId = form.watch('carrierId');
  const selectedRole = form.watch('role');

  // Load drivers when carrier is selected
  const loadDrivers = useCallback(async (carrierId: number) => {
    if (!organization?.id) return;
    setDriversLoading(true);
    try {
      const carrierDrivers = await driversService.getByCarrier(organization.id, carrierId);
      // Filter to only show drivers that don't have a user_id attached yet (available drivers)
      // Note: The drivers table doesn't have user_id, so we show all drivers for the carrier
      setDrivers(carrierDrivers);
    } catch (error) {
      console.error('Error loading drivers:', error);
      setDrivers([]);
    } finally {
      setDriversLoading(false);
    }
  }, [organization?.id]);

  // Effect to load drivers when carrier changes
  useEffect(() => {
    if (isCarrierMember && selectedCarrierId) {
      loadDrivers(selectedCarrierId);
    } else {
      setDrivers([]);
    }
  }, [isCarrierMember, selectedCarrierId, loadDrivers]);

  // Effect to clear fields when isCarrierMember is toggled off
  useEffect(() => {
    if (!isCarrierMember) {
      form.setValue('carrierId', null);
      form.setValue('driverId', null);
    }
  }, [isCarrierMember, form]);

  // Effect to clear driver when role changes to non-DRIVER
  useEffect(() => {
    if (selectedRole !== 'DRIVER') {
      form.setValue('driverId', null);
    }
  }, [selectedRole, form]);

  // Reset form when user changes or dialog opens/closes
  useEffect(() => {
    if (open) {
      if (user) {
        // Support both English and Spanish field names for backward compatibility
        // Convert role label to enum value if needed
        const userRole = user.role || user.rol || "STAFF";
        const roleEnum = mapStringToUserRole(userRole);
        // Ensure role is a valid organization role (exclude DEV)
        const validRole = (roleEnum === 'OWNER' || roleEnum === 'ADMIN' || roleEnum === 'STAFF' || roleEnum === 'DRIVER')
          ? roleEnum
          : 'STAFF' as const;

        form.reset({
          firstName: user.firstName || user.nombre || "",
          lastName: user.lastName || user.apellido || "",
          email: user.email || user.correo || "",
          role: validRole,
          phone: user.phone || user.telefono || "",
          organizationId: user.organizationId || "",
          isCarrierMember: user.isCarrierMember || false,
          carrierId: user.carrierId ?? null,
          driverId: user.driverId ?? null,
        });
      } else {
        // When creating new user, use first available role as default
        form.reset({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          role: defaultRole,
          organizationId: currentOrgId || "",
          isCarrierMember: false,
          carrierId: null,
          driverId: null,
        });
      }
    }
  }, [user, open, form, defaultRole, currentOrgId]);

  const handleSave = async (data: UserFormData) => {
    const userData: User = {
      ...(user?.id && { id: user.id }),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: data.role,
      phone: data.phone || "",
      organizationId: data.organizationId,
      ...(user?.createdAt && { createdAt: user.createdAt }),
      status: user?.status || 'Activo',
      isCarrierMember: data.isCarrierMember || false,
      carrierId: data.isCarrierMember ? data.carrierId : null,
      driverId: data.isCarrierMember ? data.driverId : null,
    };

    await onSave(userData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step === 'credentials' && onBackToForm && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBackToForm}
                className="h-8 w-8 -ml-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle className={cn("text-xl font-semibold flex-1", step === 'credentials' && "flex items-center gap-2")}>
              {step === 'credentials' ? (
                <>
                  <Key className="w-5 h-5 text-blue-600" />
                  Credenciales de Acceso
                </>
              ) : user ? (
                <>
                  <Edit className="w-5 h-5 text-primary inline mr-2" />
                  Editar Usuario
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 text-primary inline mr-2" />
                  Nuevo Usuario
                </>
              )}
            </DialogTitle>
          </div>
          <DialogDescription className={cn(
            "mt-2",
            (step === 'credentials' && onBackToForm) ? "pl-9" : ""
          )}>
            {step === 'credentials'
              ? `Credenciales generadas para ${(user?.firstName || user?.nombre || form.getValues('firstName') || "").trim()} ${(user?.lastName || user?.apellido || form.getValues('lastName') || "").trim()}. Cópialas y envíalas al cliente de forma segura.`
              : user
                ? "Actualiza la información del usuario en el sistema."
                : "Completa los datos para crear un nuevo usuario en ColdSync."}
          </DialogDescription>
        </DialogHeader>

        {step === 'credentials' && credentials ? (
          <div className="py-4">
            <UserCredentialsFields
              credentials={credentials}
              onCopyAll={async () => {
                const text = `Email: ${credentials.email}\nContraseña: ${credentials.password}`;
                try {
                  await navigator.clipboard.writeText(text);
                  setCopiedField('all');
                  toast.success('Todas las credenciales copiadas');
                  setTimeout(() => setCopiedField(null), 2000);
                } catch (err) {
                  toast.error('Error al copiar');
                }
              }}
              copiedField={copiedField}
              onCopy={async (text, field) => {
                try {
                  await navigator.clipboard.writeText(text);
                  setCopiedField(field);
                  toast.success(`${field === 'email' ? 'Email' : 'Contraseña'} copiada`);
                  setTimeout(() => setCopiedField(null), 2000);
                } catch (err) {
                  toast.error('Error al copiar');
                }
              }}
            />
            <DialogFooter className="mt-6 border-t pt-4">
              <Button onClick={onClose} className="w-full">
                Finalizar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Juan" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Pérez" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo Electrónico *</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="juan.perez@coldsync.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" placeholder="+56 9 1234 5678" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol *</FormLabel>
                      <FormControl>
                        <SmartSelect
                          value={field.value}
                          onChange={field.onChange}
                          options={availableRoles}
                          placeholder="Seleccionar rol..."
                          searchable={false}
                          disabled={!!isEditingSelf}
                        />
                      </FormControl>
                      <FormMessage />
                      {isEditingSelf && (
                        <p className="text-xs text-gray-500">
                          No puedes modificar tu propio rol
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                {/* Carrier Member Section */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4 space-y-4">
                  <FormField
                    control={form.control}
                    name="isCarrierMember"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Es miembro de transportista</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Marcar si el usuario pertenece a una línea de transporte
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  {isCarrierMember && (
                    <>
                      <FormField
                        control={form.control}
                        name="carrierId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Transportista *</FormLabel>
                            <FormControl>
                              <SmartSelect
                                value={field.value?.toString() || ""}
                                onChange={(val) => {
                                  field.onChange(val ? parseInt(val, 10) : null);
                                  // Clear driver when carrier changes
                                  form.setValue('driverId', null);
                                }}
                                options={carriers.map(c => ({
                                  value: c.id.toString(),
                                  label: c.commercial_name
                                }))}
                                placeholder={carriersLoading ? "Cargando..." : "Seleccionar transportista..."}
                                searchable={true}
                                disabled={carriersLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {selectedCarrierId && selectedRole === 'DRIVER' && (
                        <FormField
                          control={form.control}
                          name="driverId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Conductor</FormLabel>
                              <FormControl>
                                <SmartSelect
                                  value={field.value?.toString() || ""}
                                  onChange={(val) => field.onChange(val ? parseInt(val, 10) : null)}
                                  options={drivers.map(d => ({
                                    value: d.id.toString(),
                                    label: d.name
                                  }))}
                                  placeholder={driversLoading ? "Cargando..." : "Seleccionar conductor..."}
                                  searchable={true}
                                  disabled={driversLoading}
                                />
                              </FormControl>
                              <FormMessage />
                              {drivers.length === 0 && !driversLoading && (
                                <p className="text-xs text-muted-foreground">
                                  No hay conductores disponibles para este transportista
                                </p>
                              )}
                            </FormItem>
                          )}
                        />
                      )}
                    </>
                  )}
                </div>

                {!user && (
                  <div className="bg-primary-light border border-primary/20 rounded-md p-4">
                    <p className="text-xs text-primary">
                      <strong>Nota:</strong> Se enviará un correo de bienvenida al usuario con instrucciones para establecer su contraseña.
                    </p>
                  </div>
                )}
              </form>
            </Form>
            <DialogFooter>
              <DialogActions
                onCancel={onClose}
                onSave={form.handleSubmit(handleSave)}
                disableSave={form.formState.isSubmitting}
              />
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
