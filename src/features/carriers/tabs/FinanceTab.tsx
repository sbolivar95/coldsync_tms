import { useFormContext } from "react-hook-form";
import { Card } from "../../../components/ui/Card";
import { CustomTextField } from "../../../components/widgets/forms/CustomTextField";
import { CustomSelectField } from "../../../components/widgets/forms/CustomSelectField";
import { CustomDateField } from "../../../components/widgets/forms/CustomDateField";
import type { Carrier } from "../../../types/database.types";
import type { CarrierFormData } from "../../../lib/schemas/carrier.schemas";
import { useCurrencyOptions } from "../hooks/useCurrencyOptions";

interface FinanceTabProps {
  carrier: Carrier | null;
}

export function FinanceTab({ carrier: _carrier }: FinanceTabProps) {
  const { options: currencyOptions, isLoading: loadingCurrencies } = useCurrencyOptions();
  // Use form context from parent FormProvider
  const form = useFormContext<CarrierFormData>();

  return (
    <div className="space-y-6">
      {/* Finanzas y Contratos */}
      <Card className="p-6">
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Finanzas y Contratos
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Contratos */}
          <CustomTextField
            form={form}
            name="contract_number"
            label="Nro. de Contrato"
            placeholder="Ej: CT-2025-001"
          />

          <CustomDateField
            form={form}
            name="contract_expires_at"
            label="Vencimiento de Contrato"
          />

          {/* Condiciones de Pago */}
          <CustomTextField
            form={form}
            name="payment_terms"
            label="Términos de Pago (días)"
            type="number"
            placeholder="30"
            required
          />

          <CustomSelectField
            form={form}
            name="currency"
            label="Moneda Base"
            options={currencyOptions}
            placeholder={loadingCurrencies ? "Cargando monedas..." : "Seleccionar moneda..."}
            searchable={false}
            disabled={loadingCurrencies}
          />
        </div>
      </Card>

      {/* Información Bancaria */}
      <Card className="p-6">
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Información Bancaria
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <CustomTextField
            form={form}
            name="bank_name"
            label="Banco"
            placeholder="Nombre de la institución"
          />

          <CustomTextField
            form={form}
            name="bank_account_number"
            label="Número de Cuenta"
            placeholder="Nro. de cuenta bancaria"
          />

          <CustomTextField
            form={form}
            name="bank_cci_swift"
            label="CCI/SWIFT"
            placeholder="Código interbancario"
          />
        </div>
      </Card>

    </div>
  );
}
