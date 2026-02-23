import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "../../../../components/ui/Card";
import { Form } from "../../../../components/ui/Form";
import { ScrollArea } from "../../../../components/ui/ScrollArea";
import { CustomTextField } from "../../../../components/widgets/forms/CustomTextField";
import { CustomSelectField } from "../../../../components/widgets/forms/CustomSelectField";
import { Info } from "lucide-react";
import { DetailFooter } from "../../../../components/widgets/DetailFooter";
import { toast } from "sonner";
import { useFormChanges } from "../../../../hooks/useFormChanges";
import { Alert, AlertDescription } from "../../../../components/ui/Alert";
import type { Organization } from "../../../../services/database/organizations.service";
import type { OrganizationFormData } from "../../../../lib/schemas/organization.schemas";
import {
  organizationFormSchema,
  currencyOptions,
  planTypeOptions,
  timezoneOptions
} from "../../../../lib/schemas/organization.schemas";
import { countriesService } from "../../../../services/database/organizations.service";
import { useAppStore } from "../../../../stores/useAppStore";
import { type SmartOption } from "../../../../components/widgets/SmartSelect";

interface OrganizationDetailProps {
  organization?: Organization;
  onBack: () => void;
  onSave: (data: OrganizationFormData) => void;
}

const statusOptions: SmartOption[] = [
  { value: "ACTIVE", label: "Activo" },
  { value: "INACTIVE", label: "Inactivo" },
];

export function OrganizationDetail({ organization, onBack, onSave }: OrganizationDetailProps) {
  const { organizationMember, isPlatformUser } = useAppStore();
  const isOwner = organizationMember?.role === 'OWNER' && !isPlatformUser;

  const { orgId } = useParams();
  const isEditMode = !!orgId && orgId !== "new";
  const [countries, setCountries] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [justSaved, setJustSaved] = useState(false);


  // Campos restringidos para OWNER
  const restrictedFields = ['legal_name', 'tax_id', 'billing_email', 'plan_type', 'status'];

  // React Hook Form with Zod validation
  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      comercial_name: "",
      legal_name: "",
      city: "",
      base_country_id: "",
      status: "ACTIVE",
      tax_id: "",
      fiscal_address: "",
      billing_email: "",
      contact_name: "",
      contact_phone: "",
      contact_email: "",
      currency: "USD",
      time_zone: "America/La_Paz",
      plan_type: "PROFESSIONAL",
    },
  });

  // Store original values to detect changes
  const [originalData, setOriginalData] = useState<OrganizationFormData | null>(null);

  // Use hook for change detection
  const { hasChanges } = useFormChanges(form, originalData, isEditMode ? "edit" : "create");

  // Load countries on component mount
  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      setLoadingCountries(true);
      const countriesData = await countriesService.getAll();
      setCountries(
        countriesData.map(country => ({
          value: country.id.toString(),
          label: country.name,
        }))
      );
    } catch (error) {
      console.error('Error loading countries:', error);
      toast.error('Error al cargar la lista de países');
    } finally {
      setLoadingCountries(false);
    }
  };

  // Reset form when organization changes
  useEffect(() => {
    const newFormData: OrganizationFormData = organization ? {
      comercial_name: organization.comercial_name || "",
      legal_name: organization.legal_name || "",
      city: organization.city || "",
      base_country_id: organization.base_country_id?.toString() || "",
      status: (organization.status as "ACTIVE" | "INACTIVE") || "ACTIVE",
      tax_id: organization.tax_id || "",
      fiscal_address: organization.fiscal_address || "",
      billing_email: organization.billing_email || "",
      contact_name: organization.contact_name || "",
      contact_phone: organization.contact_phone || "",
      contact_email: organization.contact_email || "",
      currency: (organization.currency as "BOB" | "USD") || "USD",
      time_zone: organization.time_zone || "America/La_Paz",
      plan_type: (organization.plan_type as "STARTER" | "PROFESSIONAL") || "PROFESSIONAL",
    } : {
      comercial_name: "",
      legal_name: "",
      city: "",
      base_country_id: "",
      status: "ACTIVE" as const,
      tax_id: "",
      fiscal_address: "",
      billing_email: "",
      contact_name: "",
      contact_phone: "",
      contact_email: "",
      currency: "USD" as const,
      time_zone: "America/La_Paz",
      plan_type: "PROFESSIONAL" as const,
    };

    form.reset(newFormData);
    setOriginalData(newFormData);
  }, [organization, form]);

  const handleSave = async () => {
    const isValid = await form.trigger(); // Trigger validation
    if (!isValid) {
      toast.error('Por favor corrige los errores en el formulario');
      return; // Don't save if validation fails
    }

    setIsLoading(true);

    try {
      const formData = form.getValues();
      await onSave(formData);

      // Feedback visual de guardado
      setJustSaved(true);
      setOriginalData({ ...formData });

      // Esperar un momento para mostrar el estado "Guardado" antes de volver
      setTimeout(() => {
        setJustSaved(false);
        handleBack();
      }, 1500);
    } catch (error) {
      console.error('Error saving organization:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Error al guardar la organización';
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    handleBack();
  };

  const handleBack = () => {
    onBack();
  };

  const isFieldRestricted = (name: string) => isOwner && restrictedFields.includes(name);

  const getHelperText = (name: string) => {
    if (isFieldRestricted(name)) {
      return (
        <span className="flex items-center gap-1">
          <Info className="h-3 w-3" />
          Solo editable por administrador de plataforma
        </span>
      );
    }
    return undefined;
  };

  return (
    <Form {...form}>
      <div className="flex flex-col h-full">
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 bg-gray-50 pb-24">
              <div className="max-w-6xl mx-auto">
                <div className="space-y-6">

                  {/* Información para OWNER sobre campos restringidos */}
                  {isOwner && (
                    <Alert className="bg-primary-light border-primary/20">
                      <Info className="h-4 w-4 text-primary" />
                      <AlertDescription className="text-sm text-primary">
                        Puedes editar campos operativos y de contacto. Los campos legales y administrativos requieren un administrador de plataforma.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Información de Identificación */}
                  <Card className="p-6">
                    <div className="mb-5">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        Información de Identificación
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {/* Información básica de la empresa */}
                      <CustomTextField
                        form={form}
                        name="comercial_name"
                        label="Nombre Comercial"
                        placeholder="Ej: Avicola Sofia"
                        required
                        disabled={isFieldRestricted('comercial_name')}
                        helperText={getHelperText('comercial_name')}
                      />

                      <CustomTextField
                        form={form}
                        name="legal_name"
                        label="Razón Social"
                        placeholder="Ej: Sofia LTDA"
                        required
                        disabled={isFieldRestricted('legal_name')}
                        helperText={getHelperText('legal_name')}
                      />

                      <CustomSelectField
                        form={form}
                        name="base_country_id"
                        label="País Base"
                        placeholder={loadingCountries ? "Cargando países..." : "Seleccionar país..."}
                        options={countries}
                        required
                        searchable={true}
                        disabled={loadingCountries || isFieldRestricted('base_country_id')}
                        helperText={getHelperText('base_country_id')}
                      />

                      <CustomTextField
                        form={form}
                        name="city"
                        label="Ciudad"
                        placeholder="Ej: Santa Cruz"
                        disabled={isFieldRestricted('city')}
                        helperText={getHelperText('city')}
                      />

                      {/* Información fiscal/legal */}
                      <CustomTextField
                        form={form}
                        name="tax_id"
                        label="NIT/RUC"
                        placeholder="Número fiscal"
                        required
                        disabled={isFieldRestricted('tax_id')}
                        helperText={getHelperText('tax_id')}
                      />

                      <CustomTextField
                        form={form}
                        name="fiscal_address"
                        label="Dirección Fiscal"
                        placeholder="Dirección completa"
                        required
                        disabled={isFieldRestricted('fiscal_address')}
                        helperText={getHelperText('fiscal_address')}
                      />

                      <CustomTextField
                        form={form}
                        name="billing_email"
                        label="Email de Facturación"
                        type="email"
                        placeholder="facturacion@empresa.com"
                        required
                        disabled={isFieldRestricted('billing_email')}
                        helperText={getHelperText('billing_email')}
                      />

                      {/* Configuración operativa */}
                      <CustomSelectField
                        form={form}
                        name="currency"
                        label="Moneda"
                        placeholder="Seleccionar moneda"
                        options={currencyOptions as unknown as SmartOption[]}
                        required
                        disabled={isFieldRestricted('currency')}
                        helperText={getHelperText('currency')}
                      />

                      <CustomSelectField
                        form={form}
                        name="time_zone"
                        label="Zona Horaria"
                        placeholder="Seleccionar zona horaria"
                        options={timezoneOptions as unknown as SmartOption[]}
                        required
                        searchable={true}
                        disabled={isFieldRestricted('time_zone')}
                        helperText={getHelperText('time_zone')}
                      />

                      <CustomSelectField
                        form={form}
                        name="plan_type"
                        label="Tipo de Plan"
                        placeholder="Seleccionar plan"
                        options={planTypeOptions as unknown as SmartOption[]}
                        required
                        disabled={isFieldRestricted('plan_type')}
                        helperText={getHelperText('plan_type')}
                      />

                      <CustomSelectField
                        form={form}
                        name="status"
                        label="Estado"
                        placeholder="Seleccionar estado"
                        options={statusOptions}
                        required
                        disabled={isFieldRestricted('status')}
                        helperText={getHelperText('status')}
                      />
                    </div>
                  </Card>

                  {/* Contacto Principal */}
                  <Card className="p-6">
                    <div className="mb-5">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        Contacto Principal
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      <CustomTextField
                        form={form}
                        name="contact_name"
                        label="Nombre del Contacto"
                        placeholder="Nombre completo"
                        required
                        disabled={isFieldRestricted('contact_name')}
                        helperText={getHelperText('contact_name')}
                      />

                      <CustomTextField
                        form={form}
                        name="contact_phone"
                        label="Teléfono del Contacto"
                        type="tel"
                        placeholder="(555) 000-0000"
                        required
                        disabled={isFieldRestricted('contact_phone')}
                        helperText={getHelperText('contact_phone')}
                      />

                      <CustomTextField
                        form={form}
                        name="contact_email"
                        label="Email del Contacto"
                        type="email"
                        placeholder="contacto@empresa.com"
                        required
                        disabled={isFieldRestricted('contact_email')}
                        helperText={getHelperText('contact_email')}
                      />
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>


        {/* Fixed Footer with Action Buttons */}
        <DetailFooter
          onCancel={handleCancel}
          onSave={handleSave}
          isSubmitting={isLoading}
          hasChanges={hasChanges}
          justSaved={justSaved}
        />
      </div>
    </Form >
  );
}