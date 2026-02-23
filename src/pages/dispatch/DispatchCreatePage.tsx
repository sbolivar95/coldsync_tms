import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../layouts/PageHeader'
import { OrderForm } from '../../features/dispatch/forms/OrderForm'

/**
 * Page for creating a new dispatch order
 * Follows the pattern: Page orchestrates feature components
 */
export function DispatchCreatePage() {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate('/dispatch')
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              Nueva Orden de Despacho
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Completa los datos para crear una nueva orden de despacho. Esta
              información se usará para planificar y asignar recursos.
            </p>
          </div>
          <OrderForm onSuccess={handleBack} onCancel={handleBack} />
        </div>
      </div>
    </div>
  )
}
