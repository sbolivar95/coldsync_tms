import { EntityDialog } from '../../../../../components/widgets/EntityDialog'
import { useState, useEffect } from 'react'
import { Input } from '../../../../../components/ui/Input'
import { Button } from '../../../../../components/ui/Button'
import { Search } from 'lucide-react'
import { Checkbox } from '../../../../../components/ui/Checkbox'
import { Badge } from '../../../../../components/ui/Badge'
import { hardwareService } from '../../../../../services/database/hardware.service'
import { toast } from 'sonner'
import { cn } from '../../../../../lib/utils'

interface AddProtocolDialogProps {
    open: boolean
    onClose: () => void
    onSyncComplete: (protocolId: number, name: string) => void
}

export function AddProtocolDialog({ open, onClose, onSyncComplete }: AddProtocolDialogProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<{ id: number; name: string; title?: string }[]>([])
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [searching, setSearching] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [searched, setSearched] = useState(false)

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (!open) {
            setQuery('')
            setResults([])
            setSelectedId(null)
            setSearching(false)
            setSyncing(false)
            setSearched(false)
        }
    }, [open])

    const handleSearch = async () => {
        if (!query.trim()) return
        const toastId = toast.loading('Buscando marcas en Flespi...')
        setSearching(true)
        setSearched(false)
        setSelectedId(null)
        try {
            const data = await hardwareService.searchFlespiProtocols(query)
            setResults(data)
            toast.dismiss(toastId)
            if (data.length === 0) {
                toast.info('No se encontraron resultados para esta búsqueda')
            }
        } catch (error) {
            console.error(error)
            toast.error('Error al buscar protocolos', { id: toastId })
            setResults([])
        } finally {
            setSearching(false)
            setSearched(true)
        }
    }

    const handleSave = async () => {
        if (!selectedId) return
        const toastId = toast.loading('Sincronizando marca y modelos...')
        setSyncing(true)
        try {
            await hardwareService.syncFlespiProtocol(selectedId)
            const selected = results.find((r) => r.id === selectedId)
            toast.success(`Marca ${selected?.title || selected?.name} añadida correctamente`, { id: toastId })
            onSyncComplete(selectedId, selected?.name || '')
            onClose()
        } catch (error) {
            console.error(error)
            toast.error('Error al sincronizar la marca', { id: toastId })
        } finally {
            setSyncing(false)
        }
    }

    return (
        <EntityDialog
            open={open}
            onClose={onClose}
            title="Añadir Nueva Marca"
            description="Busca la marca (protocolo) en el catálogo global de Flespi y añádela a tu sistema."
            onSave={handleSave}
            disableSave={!selectedId || syncing}
            saveLabel={syncing ? 'Sincronizando...' : 'Añadir Marca'}
            maxWidth="max-w-lg"
        >
            <div className="space-y-4">
                {/* Search Field */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700">
                        Buscar Protocolo <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Ej. Suntech, Queclink, Telematika..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pl-10"
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <Button
                            type="button"
                            onClick={handleSearch}
                            disabled={searching || syncing || !query.trim()}
                            variant="secondary"
                            className="min-w-[100px]"
                        >
                            {searching ? 'Buscando...' : 'Buscar'}
                        </Button>
                    </div>
                </div>

                {/* Results List */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700">
                        Resultados ({results.length})
                    </label>

                    <div className="border border-gray-300 rounded-md h-[240px] overflow-y-auto bg-white">
                        {searched && results.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-500 gap-2">
                                <Search className="h-8 w-8 text-gray-300" />
                                <p className="text-sm font-medium">No se encontraron resultados</p>
                                <p className="text-xs text-gray-400">Intenta con otro nombre de fabricante.</p>
                            </div>
                        ) : !searched && results.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-400 gap-2">
                                <div className="bg-gray-50 p-3 rounded-full">
                                    <Search className="h-6 w-6 text-gray-300" />
                                </div>
                                <p className="text-xs">Usa el buscador para encontrar protocolos soportados.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {results.map((item) => {
                                    const isSelected = selectedId === item.id
                                    return (
                                        <label
                                            key={item.id}
                                            className={cn(
                                                "flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-gray-50",
                                                isSelected && "bg-primary-light/50 hover:bg-primary-light/50"
                                            )}
                                        >
                                            <div className="mt-0.5">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() => setSelectedId(item.id)}
                                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className={cn(
                                                        "text-sm font-semibold transition-colors",
                                                        isSelected ? "text-primary" : "text-gray-900"
                                                    )}>
                                                        {item.title || item.name}
                                                    </span>
                                                    {isSelected && (
                                                        <Badge variant="secondary" className="bg-primary-light text-primary hover:bg-primary-light text-[10px] h-4">
                                                            Seleccionado
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    ID de Protocolo: {item.id}
                                                </p>
                                            </div>
                                        </label>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                    <p className="text-[11px] text-gray-500">
                        Selecciona la marca correcta de la lista para sincronizar todos sus modelos.
                    </p>
                </div>
            </div>
        </EntityDialog>
    )
}
