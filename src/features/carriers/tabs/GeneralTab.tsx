import { useFormContext } from "react-hook-form";
import { Card } from "../../../components/ui/Card";
import { CustomTextField } from "../../../components/widgets/forms/CustomTextField";
import { CustomSelectField } from "../../../components/widgets/forms/CustomSelectField";
import type { Carrier } from "../../../types/database.types";
import type { CarrierFormData } from "../../../lib/schemas/carrier.schemas";
import { useCountries } from "../hooks/useCountries";
import { useCarrierTypeOptions } from "../hooks/useCarrierTypeOptions";

interface GeneralTabProps {
  carrier: Carrier | null;
}

export function GeneralTab({ carrier: _carrier }: GeneralTabProps) {
  const { countries, isLoading: loadingCountries } = useCountries();
  const { options: carrierTypeOptions, isLoading: loadingCarrierTypes } = useCarrierTypeOptions();
  // Use form context from parent FormProvider
  const form = useFormContext<CarrierFormData>();

  return (
    <div className="space-y-6">
      {/* Información de Identificación */}
      <Card className="p-6">
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Información de Identificación
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Información básica del transportista */}
          <CustomTextField
            form={form}
            name="carrier_id"
            label="ID Transportista"
            placeholder="Ej: CAR-001"
            disabled
          />

          <CustomSelectField
            form={form}
            name="carrier_type"
            label="Tipo de Transportista"
            options={carrierTypeOptions}
            placeholder={loadingCarrierTypes ? "Cargando tipos..." : "Seleccionar tipo..."}
            searchable={false}
            disabled={loadingCarrierTypes}
            required
          />

          <CustomTextField
            form={form}
            name="commercial_name"
            label="Nombre Comercial"
            placeholder="Ej: ColdChain Express"
            required
          />

          <CustomTextField
            form={form}
            name="legal_name"
            label="Razón Social"
            placeholder="Nombre legal de la empresa"
            required
          />

          {/* Información fiscal/legal */}
          <CustomTextField
            form={form}
            name="tax_id"
            label="ID Tributario"
            placeholder="Número fiscal"
            required
          />

          <CustomTextField
            form={form}
            name="legal_representative"
            label="Representante Legal"
            placeholder="Nombre completo"
            required
          />

          <CustomTextField
            form={form}
            name="fiscal_address"
            label="Dirección Fiscal"
            placeholder="Dirección completa"
            required
          />

          {/* Ubicación */}
          <CustomSelectField
            form={form}
            name="country"
            label="País Base"
            options={countries.map(country => ({
              value: country.name,
              label: country.name,
            }))}
            placeholder={loadingCountries ? "Cargando países..." : "Seleccionar país..."}
            searchable={true}
            disabled={loadingCountries}
            required
          />

          <CustomTextField
            form={form}
            name="city"
            label="Ciudad / Departamento"
            placeholder="Ej: La Paz"
            required
          />
        </div>
      </Card>

      {/* Contacto */}
      <Card className="p-6">
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Contacto
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <CustomTextField
            form={form}
            name="contact_name"
            label="Nombre de Contacto (Operaciones)"
            placeholder="Nombre completo"
            required
          />

          <CustomTextField
            form={form}
            name="contact_phone"
            label="Teléfono"
            type="tel"
            placeholder="(555) 000-0000"
            required
          />

          <CustomTextField
            form={form}
            name="contact_email"
            label="Email"
            type="email"
            placeholder="ops@empresa.com"
            required
          />

          <CustomTextField
            form={form}
            name="ops_phone_24_7"
            label="Teléfono 24/7"
            type="tel"
            placeholder="Línea de emergencia"
            required
          />

          <CustomTextField
            form={form}
            name="finance_email"
            label="Email Finanzas"
            type="email"
            placeholder="finanzas@empresa.com"
            required
          />
        </div>
      </Card>

    </div>
  );
}
