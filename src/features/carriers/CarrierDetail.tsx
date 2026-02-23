import { PageHeader } from "../../layouts/PageHeader";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "../../components/ui/Form";
import { toast } from "sonner";
import { useFormChanges } from "../../hooks/useFormChanges";
import { ScrollArea } from "../../components/ui/ScrollArea";
import { DetailFooter } from "../../components/widgets/DetailFooter";
import { GeneralTab } from "./tabs/GeneralTab";
import { FinanceTab } from "./tabs/FinanceTab";
import { AllocationTab } from "./tabs/AllocationTab";
import type { Database } from "../../types/database.types";
import { carrierSchema, type CarrierFormData } from "../../lib/schemas/carrier.schemas";
import { defaultAllocationRule } from "../../lib/schemas/carrierAllocation.schemas";
import { carrierAllocationService } from "../../services/database/carrierAllocation.service";
import { useAuth } from "../../hooks/useAuth";


type Carrier = Database['public']['Tables']['carriers']['Row'];

interface CarrierDetailProps {
  carrier: Carrier | null; // null for create mode
  onBack: () => void;
  onSave: (data: CarrierFormData) => Promise<void>;
  mode?: "edit" | "create";
}

export function CarrierDetail({ carrier, onBack, onSave, mode = "edit" }: CarrierDetailProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const { organizationMember } = useAuth();

  // Single form instance shared across all tabs
  const form = useForm<CarrierFormData>({
    resolver: zodResolver(carrierSchema) as any,
    defaultValues: {
      carrier_id: "",
      commercial_name: "",
      legal_name: "",
      carrier_type: "THIRD PARTY",
      tax_id: "",
      legal_representative: "",
      country: "",
      city: "",
      fiscal_address: "",
      contact_name: "",
      contact_phone: "",
      contact_email: "",
      ops_phone_24_7: "",
      finance_email: "",
      contract_number: "",
      contract_expires_at: "",
      payment_terms: 30,
      currency: "",
      bank_name: "",
      bank_account_number: "",
      bank_cci_swift: "",
      allocation_rule: defaultAllocationRule, // Valid default for allocation rules
    },
  });

  // Store original values to detect changes
  const [originalData, setOriginalData] = useState<CarrierFormData | null>(null);

  // Use hook for change detection
  const { hasChanges } = useFormChanges(form, originalData, mode);

  // Reset form and fetch extra data when carrier changes
  useEffect(() => {
    async function loadData() {
      // 1. Base Carrier Data
      let newFormData: CarrierFormData = carrier ? {
        carrier_id: carrier.carrier_id || "",
        commercial_name: carrier.commercial_name || "",
        legal_name: carrier.legal_name || "",
        carrier_type: carrier.carrier_type || "THIRD PARTY",
        tax_id: carrier.tax_id || "",
        legal_representative: carrier.legal_representative || "",
        country: carrier.country || "",
        city: carrier.city || "",
        fiscal_address: carrier.fiscal_address || "",
        contact_name: carrier.contact_name || "",
        contact_phone: carrier.contact_phone || "",
        contact_email: carrier.contact_email || "",
        ops_phone_24_7: carrier.ops_phone_24_7 || "",
        finance_email: carrier.finance_email || "",
        contract_number: carrier.contract_number || "",
        contract_expires_at: carrier.contract_expires_at ? carrier.contract_expires_at.split('T')[0] : "",
        payment_terms: carrier.payment_terms || 30,
        currency: carrier.currency || "",
        bank_name: carrier.bank_name || "",
        bank_account_number: carrier.bank_account_number || "",
        bank_cci_swift: carrier.bank_cci_swift || "",
      } : {
        carrier_id: "",
        commercial_name: "",
        legal_name: "",
        carrier_type: "THIRD PARTY",
        tax_id: "",
        legal_representative: "",
        country: "",
        city: "",
        fiscal_address: "",
        contact_name: "",
        contact_phone: "",
        contact_email: "",
        ops_phone_24_7: "",
        finance_email: "",
        contract_number: "",
        contract_expires_at: "",
        payment_terms: 30,
        currency: "",
        bank_name: "",
        bank_account_number: "",
        bank_cci_swift: "",
      };

      // 2. Fetch Allocation Rules if expecting edit
      if (carrier && organizationMember?.org_id) {
        try {
          const rule = await carrierAllocationService.getRule(organizationMember.org_id, carrier.id);
          if (rule) {
             newFormData.allocation_rule = {
               target_orders: rule.target_orders,
               reset_every_days: rule.reset_every_days,
               starts_on: rule.starts_on,
               ends_on: rule.ends_on,
               reject_rate_threshold: rule.reject_rate_threshold,
               carryover_enabled: rule.carryover_enabled,
               is_active: rule.is_active
             };
          } else {
             // Use default if no rule exists yet
             newFormData.allocation_rule = defaultAllocationRule;
          }
        } catch (e) {
          console.error("Error loading allocation rule", e);
          newFormData.allocation_rule = defaultAllocationRule;
        }
      } else {
        newFormData.allocation_rule = defaultAllocationRule;
      }

      form.reset(newFormData);
      setOriginalData(newFormData);
      setJustSaved(false);
    }

    loadData();
  }, [carrier, form, organizationMember?.org_id]);

  const handleSave = async () => {
    const isValid = await form.trigger(); // Trigger validation
    if (!isValid) {
      toast.error('Por favor corrige los errores en el formulario');
      return; // Don't save if validation fails
    }

    setIsLoading(true);
    setJustSaved(false);

    try {
      const formData = form.getValues();
      
      // 1. Save Carrier Base Data used passed prop
      // Exclude allocation_rule as it's not a column in carriers table
      const { allocation_rule, ...carrierData } = formData;
      await onSave(carrierData as CarrierFormData);

      // 2. Save Allocation Rules if valid carrier and organization
      // Note: "carrier" prop might be stale if we just created it, but onSave usually handles the update/create of the carrier itself.
      // We need the ACTUAL carrier ID. In create mode, we rely on onSave returning it or the parent refetching.
      // However, for this UI pattern, typically onSave handles the main entity.
      // If validation passed, let's try to save the rule if we are in EDIT mode (where carrier.id is known)
      // In CREATE mode, handling "dependent" records is tricky without the ID returning from onSave.
      // For now, let's assume we can only save rules if we have an ID (Edit Mode).
      
      if (carrier?.id && organizationMember?.org_id && formData.allocation_rule) {
        await carrierAllocationService.upsertRule(organizationMember.org_id, {
           carrier_id: carrier.id,
           org_id: organizationMember.org_id, 
           ...formData.allocation_rule
        });
      }

      setJustSaved(true);
      setOriginalData({ ...formData });

      // Always go back to list after saving
      onBack();

      setTimeout(() => setJustSaved(false), 3000);
    } catch (error) {
      console.error('Error saving carrier:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Error al guardar el transportista';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Siempre volver a la lista de carriers
    onBack();
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        tabs={[
          { id: "general", label: "General", active: activeTab === "general", onClick: () => setActiveTab("general") },
          { id: "finanzas", label: "Finanzas y Legal", active: activeTab === "finanzas", onClick: () => setActiveTab("finanzas") },
          { id: "allocation", label: "Reglas de Asignación", active: activeTab === "allocation", onClick: () => setActiveTab("allocation") },

        ]}
      />

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 bg-gray-50 pb-24">
            <div className="max-w-6xl mx-auto">
              {/* Single FormProvider wrapping all tabs */}
              <Form {...form}>
                 {/* 
                     NOTE: We are NOT wrapping handleSave here directly if we want to customize the submit event 
                     But form.handleSubmit(handleSave) is standard.
                 */}
                <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
                  {/* Render tabs conditional visibility */}
                  <div className={activeTab === "general" ? "" : "hidden"}>
                    <GeneralTab carrier={carrier} />
                  </div>

                  <div className={activeTab === "finanzas" ? "" : "hidden"}>
                    <FinanceTab carrier={carrier} />
                  </div>
                  
                  <div className={activeTab === "allocation" ? "" : "hidden"}>
                     {/* Pass carrier.id for status fetching. If create mode, it's undefined, which is fine (shows empty state) */}
                    <AllocationTab />
                  </div>


                </form>
              </Form>
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
        saveLabel={mode === "create" ? "Crear Transportista" : "Guardar"}
      />
    </div>
  );
}