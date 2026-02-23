import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/AlertDialog'
import { AlertCircle } from 'lucide-react'

interface AssignmentValidationDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  errors: string[]
  fleetUnitName: string
  orderNumber: string
}

export function AssignmentValidationDialog({
  isOpen,
  onOpenChange,
  errors,
  fleetUnitName,
  orderNumber,
}: AssignmentValidationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-red-200 bg-red-50 sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <AlertDialogTitle>Asignación Inválida</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-red-900 font-medium pt-2">
            No se puede asignar la orden {orderNumber} a la unidad {fleetUnitName}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="my-2 p-3 bg-white rounded-md border border-red-100 shadow-sm">
          <ul className="list-disc pl-5 space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-800">
                {error}
              </li>
            ))}
          </ul>
        </div>

        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={() => onOpenChange(false)}
            className="bg-red-600 text-white hover:bg-red-700 border-none"
          >
            Entendido
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
