import { useState } from "react";
import { SmartSelect, SmartOption } from "./SmartSelect";

/**
 * EJEMPLOS DE USO - SmartSelect Component
 * 
 * Este archivo contiene ejemplos de uso para los 3 modos del SmartSelect:
 * 1. Single Select (Imagen 1)
 * 2. Multi Select (Imagen 2)
 * 3. Smart Select (Imagen 3)
 */

export function SmartSelectExamples() {
  return (
    <div className="space-y-12 p-8 max-w-4xl">
      <Example1_SingleSelect />
      <Example2_MultiSelect />
      <Example3_SmartSelect />
    </div>
  );
}

// ==================== EJEMPLO 1: Single Select ====================
// Selección simple con búsqueda (Imagen 1)

function Example1_SingleSelect() {
  const [selectedReefer, setSelectedReefer] = useState<string>("");

  const reeferOptions: SmartOption[] = [
    { value: "reefer-16m", label: "Reefer 16m" },
    { value: "reefer-14.6m", label: "Reefer 14.6m" },
    { value: "multi-temp-14.6m-1", label: "Multi-Temp 14.6m" },
    { value: "multi-temp-14.6m-2", label: "Multi-Temp 14.6m" },
    { value: "dry-van-16m", label: "Dry Van 16m" },
    { value: "dry-van-14.6m", label: "Dry Van 14.6m" },
    { value: "refrigerado", label: "Refrigerado" },
    { value: "congelado", label: "Congelado" },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Ejemplo 1: Single Select
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Selección simple con búsqueda. Ideal para campos de formulario estándar.
      </p>

      <div className="max-w-md">
        <SmartSelect
          label="Tipo de Reefer"
          id="reefer-type"
          mode="single"
          placeholder="Seleccionar tipo de reefer..."
          searchPlaceholder="Buscar tipo de reefer..."
          options={reeferOptions}
          value={selectedReefer}
          onChange={(value) => setSelectedReefer(value as string)}
          required
        />

        {selectedReefer && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            Seleccionado: <strong>{selectedReefer}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== EJEMPLO 2: Multi Select ====================
// Selección múltiple con checkboxes (Imagen 2)

function Example2_MultiSelect() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const categoryOptions: SmartOption[] = [
    { value: "farmaceuticos", label: "Farmacéuticos" },
    { value: "vacunas", label: "Vacunas" },
    { value: "alimentos-congelados", label: "Alimentos Congelados" },
    { value: "helados", label: "Helados" },
    { value: "productos-lacteos", label: "Productos Lácteos" },
    { value: "productos-frescos", label: "Productos Frescos" },
    { value: "carne-fresca", label: "Carne Fresca" },
    { value: "mariscos", label: "Mariscos" },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Ejemplo 2: Multi Select
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Selección múltiple con checkboxes. Ideal para filtros y categorías.
      </p>

      <div className="max-w-md">
        <SmartSelect
          label="Categorías de Producto"
          id="product-categories"
          mode="multi"
          placeholder="Seleccionar categorías..."
          searchPlaceholder="Buscar categoría de producto..."
          options={categoryOptions}
          value={selectedCategories}
          onChange={(value) => setSelectedCategories(value as string[])}
        />

        {selectedCategories.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm font-medium mb-2">
              Seleccionados ({selectedCategories.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((cat) => {
                const option = categoryOptions.find((o) => o.value === cat);
                return (
                  <span
                    key={cat}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                  >
                    {option?.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== EJEMPLO 3: Smart Select ====================
// Selección inteligente con filtros, scores y metadata (Imagen 3)

function Example3_SmartSelect() {
  const [selectedResource, setSelectedResource] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("mejor-match");

  const resourceOptions: SmartOption[] = [
    {
      value: "CCE-T203",
      label: "CCE-T203",
      secondaryId: "CCE-103",
      utilization: 103,
      score: 97,
      subtitle: "Multi-Temp 14.6m • David García • FrostLine Logistics",
      tags: ["Buena utilización", "Temperatura exacta (Comp. 1)", "Bajo cupo mínimo"],
      metadata: [
        { label: "Remolque", value: "multi-temperatura (flexible)" },
      ],
    },
    {
      value: "CCE-T204",
      label: "CCE-T204",
      secondaryId: "CCE-104",
      utilization: 94,
      score: 94,
      subtitle: "Reefer 16m • David Thompson • Arctic Transport Inc",
      tags: ["Utilización óptima", "Temperatura exacta", "Bajo cupo mínimo"],
    },
    {
      value: "CCE-T201",
      label: "CCE-T201",
      secondaryId: "CCE-101",
      utilization: 94,
      score: 90,
      subtitle: "Reefer 16m • Michael Anderson • ColdChain Express LLC",
      tags: ["Utilización óptima", "Temperatura exacta"],
    },
  ];

  const filters = [
    { id: "mejor-match", label: "Mejor Match" },
    { id: "disponibles", label: "Disponibles" },
    { id: "todos", label: "Todos" },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Ejemplo 3: Smart Select
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Selección inteligente con filtros, scores y metadata completa. Ideal para
        asignación de recursos (remolques, conductores, transportistas).
      </p>

      <div className="max-w-2xl">
        <SmartSelect
          label="Asignar Recurso"
          id="resource-assignment"
          mode="smart"
          placeholder="Seleccionar recurso..."
          searchPlaceholder="Buscar por remolque, conductor, transportista..."
          options={resourceOptions}
          value={selectedResource}
          onChange={(value) => setSelectedResource(value as string)}
          filters={filters}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          maxHeight="480px"
        />

        {selectedResource && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-sm font-medium text-green-900 mb-2">
              ✓ Recurso Asignado
            </p>
            <div className="text-sm text-green-700">
              {resourceOptions.find((o) => o.value === selectedResource)?.label}
              {" - "}
              {resourceOptions.find((o) => o.value === selectedResource)?.subtitle}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== EJEMPLO 4: Uso en Formularios ====================
// Integración con formularios existentes

export function SmartSelectInForm() {
  const [formData, setFormData] = useState({
    tipoRemolque: "",
    categorias: [] as string[],
    recursoAsignado: "",
  });

  return (
    <div className="space-y-6 p-6 bg-gray-50 rounded-lg border border-gray-200 max-w-2xl">
      <h3 className="text-lg font-semibold text-gray-900">
        Uso en Formulario
      </h3>

      <SmartSelect
        label="Tipo de Remolque"
        id="tipo-remolque"
        mode="single"
        required
        options={[
          { value: "reefer", label: "Reefer" },
          { value: "dry-van", label: "Dry Van" },
          { value: "multi-temp", label: "Multi-Temperatura" },
        ]}
        value={formData.tipoRemolque}
        onChange={(value) =>
          setFormData({ ...formData, tipoRemolque: value as string })
        }
      />

      <SmartSelect
        label="Categorías de Producto"
        id="categorias"
        mode="multi"
        options={[
          { value: "farmaceuticos", label: "Farmacéuticos" },
          { value: "alimentos", label: "Alimentos" },
          { value: "lacteos", label: "Lácteos" },
        ]}
        value={formData.categorias}
        onChange={(value) =>
          setFormData({ ...formData, categorias: value as string[] })
        }
      />

      <SmartSelect
        label="Recurso Asignado"
        id="recurso"
        mode="smart"
        options={[
          {
            value: "CCE-T203",
            label: "CCE-T203",
            score: 97,
            subtitle: "Multi-Temp 14.6m • FrostLine Logistics",
          },
        ]}
        value={formData.recursoAsignado}
        onChange={(value) =>
          setFormData({ ...formData, recursoAsignado: value as string })
        }
      />

      <div className="pt-4 border-t border-gray-200">
        <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>
    </div>
  );
}
