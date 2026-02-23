import { useState, useCallback, useMemo } from 'react'
import { Search, Plus, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { EntityDialog } from '../../../components/widgets/EntityDialog'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../../components/ui/Form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { laneTypeSchema, type LaneTypeFormData } from '../../../lib/schemas/lane.schemas'
import { LaneTypeItem } from './LaneTypeItem'
import type { LaneType } from '../../../types/database.types'

export type ViewMode = 'list' | 'create' | 'edit' | 'delete'

export interface LaneTypeManagerDialogProps {
    laneTypes: LaneType[]
    onClose: () => void
    onCreate: (data: { name: string, description?: string | null }) => Promise<void>
    onUpdate: (id: number, data: { name: string, description?: string | null }) => Promise<void>
    onDelete: (id: number) => Promise<void>
    loading?: boolean
    height?: string
}

export function LaneTypeManagerDialog({
    laneTypes,
    onClose,
    onCreate,
    onUpdate,
    onDelete,
    loading = false,
    height = '400px',
}: LaneTypeManagerDialogProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('list')
    const [selectedType, setSelectedType] = useState<LaneType | undefined>(undefined)
    const [searchQuery, setSearchQuery] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<LaneTypeFormData>({
        resolver: zodResolver(laneTypeSchema),
        defaultValues: {
            name: '',
            description: '',
        },
    })

    const filteredTypes = useMemo(() => laneTypes.filter(type =>
        searchQuery === '' ||
        type.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [laneTypes, searchQuery])

    const handleBack = useCallback(() => {
        setViewMode('list')
        setSelectedType(undefined)
        form.reset({ name: '' })
    }, [form])

    const startCreate = useCallback(() => {
        setViewMode('create')
        form.reset({ name: '' })
    }, [form])

    const startEdit = useCallback((type: LaneType) => {
        setSelectedType(type)
        setViewMode('edit')
        form.reset({
            name: type.name,
            description: type.description || '',
        })
    }, [form])

    const startDelete = useCallback((type: LaneType) => {
        setSelectedType(type)
        setViewMode('delete')
    }, [])

    const handleSave = async (data: LaneTypeFormData) => {
        try {
            setIsSubmitting(true)
            if (viewMode === 'edit' && selectedType) {
                await onUpdate(selectedType.id, { name: data.name, description: data.description })
            } else {
                await onCreate({ name: data.name, description: data.description })
            }
            handleBack()
        } catch (error) {
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleConfirmDelete = async () => {
        if (!selectedType) return
        try {
            setIsSubmitting(true)
            await onDelete(selectedType.id)
            handleBack()
        } catch (error) {
        } finally {
            setIsSubmitting(false)
        }
    }

    const dialogConfig = useMemo(() => {
        switch (viewMode) {
            case 'create':
                return {
                    title: 'Agregar Tipo de Carril',
                    description: 'Define un nuevo tipo de carril para la organización',
                    saveLabel: 'Guardar',
                    cancelLabel: 'Cancelar',
                    onSave: form.handleSubmit(handleSave),
                    onCancel: handleBack,
                    disableSave: !form.formState.isValid || isSubmitting,
                    variant: 'default' as const
                }
            case 'edit':
                return {
                    title: (
                        <>
                            Editar <span className="font-bold">{selectedType?.name}</span>
                        </>
                    ),
                    description: 'Modifica el nombre del tipo de carril',
                    saveLabel: 'Guardar',
                    cancelLabel: 'Cancelar',
                    onSave: form.handleSubmit(handleSave),
                    onCancel: handleBack,
                    disableSave: !form.formState.isValid || isSubmitting,
                    variant: 'default' as const
                }
            case 'delete':
                return {
                    title: (
                        <>
                            ¿Eliminar <span className="font-bold">{selectedType?.name}</span>?
                        </>
                    ),
                    description: 'Esta acción es irreversible y podría afectar los carriles existentes.',
                    saveLabel: 'Sí, Eliminar',
                    cancelLabel: 'No, Cancelar',
                    onSave: handleConfirmDelete,
                    onCancel: handleBack,
                    disableSave: isSubmitting,
                    variant: 'destructive' as const
                }
            default:
                return {
                    title: 'Gestionar Tipos de Carril',
                    description: 'Configura los tipos de carril disponibles para tu organización',
                    saveLabel: 'Listo',
                    cancelLabel: 'Cerrar',
                    onSave: onClose,
                    onCancel: onClose,
                    disableSave: false,
                    variant: 'default' as const
                }
        }
    }, [viewMode, selectedType, form, isSubmitting, handleSave, handleConfirmDelete, handleBack, onClose])

    return (
        <EntityDialog
            open={true}
            onClose={onClose}
            title={dialogConfig.title}
            description={dialogConfig.description}
            showBackButton={viewMode !== 'list'}
            onBack={handleBack}
            maxWidth="max-w-md"
            onSave={dialogConfig.onSave}
            onCancel={dialogConfig.onCancel}
            saveLabel={dialogConfig.saveLabel}
            cancelLabel={dialogConfig.cancelLabel}
            disableSave={dialogConfig.disableSave}
            variant={dialogConfig.variant}
        >
            <div className="flex flex-col gap-4 relative" style={{ height }}>
                {(loading || isSubmitting) && (
                    <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center rounded-md">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                )}

                {viewMode === 'list' && (
                    <>
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar tipos de carril..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button
                                onClick={startCreate}
                                size="sm"
                                className="bg-primary hover:bg-primary80 text-white"
                            >
                                <Plus className="w-4 h-4" />
                                Nuevo
                            </Button>
                        </div>

                        <div className="border border-gray-100 rounded-md flex-1 min-h-0 overflow-y-auto">
                            {filteredTypes.length === 0 ? (
                                <div className="p-4 text-center h-full flex flex-col justify-center items-center">
                                    <p className="text-xs text-gray-400 italic">
                                        {searchQuery ? `No se encontraron resultados para "${searchQuery}"` : 'No hay tipos de carril configurados'}
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {filteredTypes.map(type => (
                                        <LaneTypeItem
                                            key={type.id}
                                            type={type}
                                            isEditing={false}
                                            onEdit={() => startEdit(type)}
                                            onDelete={() => startDelete(type)}
                                            disabled={loading || isSubmitting}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <p className="text-[10px] text-gray-500">
                                Los tipos de carril permiten categorizar y filtrar tus corredores logísticos.
                            </p>
                            <p className="text-[10px] text-gray-600 font-medium">
                                {filteredTypes.length} tipos
                            </p>
                        </div>
                    </>
                )}

                {(viewMode === 'create' || viewMode === 'edit') && (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-2">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Ej: Nacional, Internacional, Local..." />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descripción</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} placeholder="Ej: Carriles de última milla para la ciudad..." />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </form>
                    </Form>
                )}

                {viewMode === 'delete' && selectedType && (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-center space-y-4">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                            <Trash2 className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-base font-semibold text-gray-900">Confirmar eliminación</h4>
                            <p className="text-xs text-gray-500 px-4">
                                ¿Estás seguro de que deseas eliminar el tipo de carril <span className="font-semibold text-gray-900">{selectedType.name}</span>?
                            </p>
                        </div>
                        <div className="mx-4 bg-orange-50 border border-orange-200 rounded-md p-3 flex gap-3 text-left">
                            <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-orange-800">
                                Asegúrate de que no haya carriles asignados a este tipo antes de proceder. El sistema impedirá la eliminación si está en uso.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </EntityDialog>
    )
}
