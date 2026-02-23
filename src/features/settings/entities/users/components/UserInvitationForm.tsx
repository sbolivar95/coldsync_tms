import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Input } from "../../../../../components/ui/Input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../../../components/ui/Form";
import { SmartSelect } from "../../../../../components/widgets/SmartSelect";
import { roleOptions } from "../../../../../lib/mockData";
import { z } from "zod";
import { Mail } from "lucide-react";

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


interface UserInvitationFormProps {
  onSubmit: (data: UserInvitationSendFormData) => void;
  onCancel: () => void;
}

export function UserInvitationForm({
  onSubmit,
  onCancel,
  currentOrgId
}: UserInvitationFormProps & { currentOrgId?: string }) {
  const form = useForm<UserInvitationSendFormData>({
    resolver: zodResolver(userInvitationSendSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "STAFF",
      organizationId: "",
    },
  });

  // Reset form when component mounts
  useEffect(() => {
    form.reset({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "STAFF",
      organizationId: currentOrgId || "",
    });
  }, [form, currentOrgId]);

  const handleSubmit = (data: UserInvitationSendFormData) => {
    onSubmit(data);
  };

  // Watch form values to enable/disable send button
  const watchedValues = form.watch();
  const isFormValid =
    watchedValues.firstName?.trim() &&
    watchedValues.lastName?.trim() &&
    watchedValues.email?.trim() &&
    watchedValues.role &&
    watchedValues.organizationId;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
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
                  options={roleOptions}
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

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!isFormValid || form.formState.isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Enviar Invitación
          </button>
        </div>
      </form>
    </Form>
  );
}