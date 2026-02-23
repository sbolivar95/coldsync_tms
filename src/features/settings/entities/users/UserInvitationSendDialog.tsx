import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../../components/ui/Dialog";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
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
import { roleOptions } from "../../../../lib/mockData";
import { z } from "zod";
import { DialogActions } from "../../../../components/widgets/DialogActions";
import { useAppStore } from "../../../../stores/useAppStore";
import type { UserRole } from "../../../../types/database.types";
import { getAvailableRolesForAssignment } from "../../../../lib/permissions";

// Schema para validación del formulario de invitación
const userInvitationSendSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Ingrese un email válido"),
  phone: z.string().optional(),
  role: z.enum(["OWNER", "ADMIN", "STAFF", "DRIVER"]),
  organizationId: z.string().min(1, "Seleccione una organización"),
});

export type UserInvitationSendFormData = z.infer<typeof userInvitationSendSchema>;

interface UserInvitationSendDialogProps {
  open: boolean;
  onClose: () => void;
  onSendInvitation: (data: UserInvitationSendFormData) => void;
  currentOrgId?: string;
  isPlatformUser?: boolean;
}

export function UserInvitationSendDialog({
  open,
  onClose,
  onSendInvitation,
  currentOrgId,
  isPlatformUser
}: UserInvitationSendDialogProps) {
  const { organizationMember } = useAppStore();
  
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
    return availableRoles.length > 0 ? availableRoles[0].value : "STAFF";
  }, [availableRoles]);
  const form = useForm<UserInvitationSendFormData>({
    resolver: zodResolver(userInvitationSendSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: defaultRole as "OWNER" | "ADMIN" | "STAFF" | "DRIVER",
      organizationId: currentOrgId || "",
    },
  });

  // Reset form when component opens or currentOrgId changes
  useEffect(() => {
    if (open) {
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: defaultRole as "OWNER" | "ADMIN" | "STAFF" | "DRIVER",
        organizationId: currentOrgId || "",
      });
    }
  }, [open, form, currentOrgId, defaultRole]);

  const handleSendInvitation = (data: UserInvitationSendFormData) => {
    onSendInvitation(data);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Enviar Invitación
          </DialogTitle>
          <DialogDescription>
            Envía una invitación con magic link único que expira según la configuración global de Supabase
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSendInvitation)} className="space-y-6 py-4">
            {/* First Name and Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Juan"
                      />
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
                      <Input
                        {...field}
                        placeholder="Pérez"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="juan.perez@coldsync.com"
                      />
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
                      <Input
                        {...field}
                        type="tel"
                        placeholder="+56 9 1234 5678"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Role */}
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nota informativa */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-xs text-blue-900">
                <strong>Nota:</strong> Se enviará un magic link único que expirará según la configuración global de Supabase
              </p>
            </div>
          </form>
        </Form>

        <DialogFooter>
          <DialogActions
            onCancel={onClose}
            onSave={form.handleSubmit(handleSendInvitation)}
            disableSave={form.formState.isSubmitting}
            saveLabel="Enviar Invitación"
            cancelLabel="Cancelar"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}