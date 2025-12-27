import { PageHeader } from "./PageHeader";
import { SmartSelectExamples, SmartSelectInForm } from "./common/SmartSelectExamples";

/**
 * PÁGINA DE DEMOSTRACIÓN - SmartSelect Component
 * 
 * Esta página muestra todos los modos y ejemplos de uso del componente SmartSelect.
 * Puedes acceder a esta página para ver el componente en acción.
 */

export function SmartSelectDemo() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="SmartSelect Component"
        subtitle="Componente reutilizable para selección simple, múltiple e inteligente"
      />
      
      <div className="flex-1 p-6 overflow-auto bg-gray-50">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Información del componente */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              📦 Componente SmartSelect
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              El componente <code className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">SmartSelect</code> es
              un componente reutilizable que soporta tres modos de selección diferentes:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  🔵 Single Select
                </h3>
                <p className="text-xs text-blue-700">
                  Selección simple con búsqueda. Ideal para campos de formulario estándar.
                </p>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <h3 className="text-sm font-semibold text-green-900 mb-2">
                  ✅ Multi Select
                </h3>
                <p className="text-xs text-green-700">
                  Selección múltiple con checkboxes. Perfecto para filtros y categorías.
                </p>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded">
                <h3 className="text-sm font-semibold text-purple-900 mb-2">
                  🧠 Smart Select
                </h3>
                <p className="text-xs text-purple-700">
                  Selección inteligente con scores, filtros y metadata. Para asignación de recursos.
                </p>
              </div>
            </div>
          </div>

          {/* Ejemplos */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <SmartSelectExamples />
          </div>

          {/* Ejemplo en formulario */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Integración en Formulario
            </h2>
            <SmartSelectInForm />
          </div>

          {/* Documentación de uso */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              📚 Guía de Uso
            </h2>
            
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">1. Importar el componente</h3>
                <pre className="bg-gray-50 p-3 rounded border border-gray-200 text-xs overflow-x-auto">
{`import { SmartSelect, SmartOption } from "./components/common/SmartSelect";`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2. Uso básico (Single Select)</h3>
                <pre className="bg-gray-50 p-3 rounded border border-gray-200 text-xs overflow-x-auto">
{`const [value, setValue] = useState("");

<SmartSelect
  label="Tipo de Reefer"
  mode="single"
  options={[
    { value: "reefer-16m", label: "Reefer 16m" },
    { value: "dry-van", label: "Dry Van 16m" },
  ]}
  value={value}
  onChange={(val) => setValue(val as string)}
/>`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">3. Multi Select</h3>
                <pre className="bg-gray-50 p-3 rounded border border-gray-200 text-xs overflow-x-auto">
{`const [values, setValues] = useState<string[]>([]);

<SmartSelect
  label="Categorías"
  mode="multi"
  options={options}
  value={values}
  onChange={(val) => setValues(val as string[])}
/>`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">4. Smart Select (con metadata)</h3>
                <pre className="bg-gray-50 p-3 rounded border border-gray-200 text-xs overflow-x-auto">
{`<SmartSelect
  label="Asignar Recurso"
  mode="smart"
  options={[
    {
      value: "CCE-T203",
      label: "CCE-T203",
      secondaryId: "CCE-103",
      score: 97,
      utilization: 103,
      subtitle: "Multi-Temp 14.6m • FrostLine",
      tags: ["Buena utilización", "Temp exacta"],
    }
  ]}
  filters={[
    { id: "mejor-match", label: "Mejor Match" },
    { id: "todos", label: "Todos" },
  ]}
  activeFilter={activeFilter}
  onFilterChange={setActiveFilter}
/>`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">5. Props disponibles</h3>
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 font-semibold">Prop</th>
                        <th className="text-left py-2 font-semibold">Tipo</th>
                        <th className="text-left py-2 font-semibold">Descripción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="py-2 font-mono">mode</td>
                        <td className="py-2 text-gray-600">'single' | 'multi' | 'smart'</td>
                        <td className="py-2 text-gray-600">Modo de selección</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono">options</td>
                        <td className="py-2 text-gray-600">SmartOption[]</td>
                        <td className="py-2 text-gray-600">Array de opciones</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono">value</td>
                        <td className="py-2 text-gray-600">string | string[]</td>
                        <td className="py-2 text-gray-600">Valor seleccionado</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono">onChange</td>
                        <td className="py-2 text-gray-600">function</td>
                        <td className="py-2 text-gray-600">Callback al cambiar</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono">searchable</td>
                        <td className="py-2 text-gray-600">boolean</td>
                        <td className="py-2 text-gray-600">Habilitar búsqueda</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono">filters</td>
                        <td className="py-2 text-gray-600">Filter[]</td>
                        <td className="py-2 text-gray-600">Tabs de filtrado (modo smart)</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono">required</td>
                        <td className="py-2 text-gray-600">boolean</td>
                        <td className="py-2 text-gray-600">Campo requerido</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono">disabled</td>
                        <td className="py-2 text-gray-600">boolean</td>
                        <td className="py-2 text-gray-600">Campo deshabilitado</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
