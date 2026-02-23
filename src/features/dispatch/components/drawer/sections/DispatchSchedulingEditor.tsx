import { useState, useEffect } from "react";
import { Check, X, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DispatchOrderWithRelations } from "../../../hooks/useDispatchOrders";

interface DispatchSchedulingEditorProps {
  order: DispatchOrderWithRelations;
  onUpdateOrder?: (orderId: string, updates: Partial<DispatchOrderWithRelations>) => Promise<void>;
}

export function DispatchSchedulingEditor({ order, onUpdateOrder }: DispatchSchedulingEditorProps) {
  // Estado para ventana de tiempo
  const [timePreference, setTimePreference] = useState<'no-preference' | 'specific-time' | 'time-window'>('no-preference');

  // Estado para edición de fecha
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState('');

  // Estados para edición de horas
  const [isEditingStartTime, setIsEditingStartTime] = useState(false);
  const [tempStartTime, setTempStartTime] = useState('');
  const [isEditingEndTime, setIsEditingEndTime] = useState(false);
  const [tempEndTime, setTempEndTime] = useState('');

  // Estado para edición de ventana de tiempo
  const [isEditingTimePreference, setIsEditingTimePreference] = useState(false);
  const [tempTimePreference, setTempTimePreference] = useState<'no-preference' | 'specific-time' | 'time-window'>('no-preference');

  // Estados para prevenir múltiples clics
  const [isSavingDate, setIsSavingDate] = useState(false);
  const [isSavingTimePreference, setIsSavingTimePreference] = useState(false);
  const [isSavingStartTime, setIsSavingStartTime] = useState(false);
  const [isSavingEndTime, setIsSavingEndTime] = useState(false);

  // Determinar preferencia de tiempo basado en pickup_window
  useEffect(() => {
    if (order.pickup_window_start && order.pickup_window_end) {
      if (order.pickup_window_start === order.pickup_window_end) {
        setTimePreference('specific-time');
      } else {
        setTimePreference('time-window');
      }
    } else {
      setTimePreference('no-preference');
    }
  }, [order.pickup_window_start, order.pickup_window_end]);

  // Determinar qué campos son editables según el substatus
  const getEditableFields = (orderSubstatus: string) => {
    switch (orderSubstatus) {
      case 'UNASSIGNED':
      case 'NEW':
      case 'ASSIGNED':
        return ['planned_start_at', 'time_preference', 'pickup_window_start', 'pickup_window_end'];
      case 'PENDING':
        return ['planned_start_at'];
      case 'PROGRAMMED':
      case 'SCHEDULED':
      case 'AT_ORIGIN':
      case 'DISPATCHED':
      case 'EN_ROUTE_TO_ORIGIN':
        return [];
      default:
        return [];
    }
  };

  const editableFields = getEditableFields(order.substatus);
  const canEdit = (field: string) => editableFields.includes(field);

  const handleSaveField = async (fieldKey: string, value: string | number) => {
    if (!onUpdateOrder) {
      return;
    }

    try {
      await onUpdateOrder(order.id, { [fieldKey]: value });
    } catch (error) {
      console.error('Error updating field:', error);
      throw error;
    }
  };

  // Handlers de fecha
  const handleDateClick = () => {
    if (canEdit('planned_start_at')) {
      setTempDate(getDateInputValue(order.planned_start_at));
      setIsEditingDate(true);
    }
  };

  const handleDateSave = async () => {
    if (isSavingDate) return;

    if (tempDate && tempDate !== getDateInputValue(order.planned_start_at)) {
      setIsSavingDate(true);
      try {
        await handleSaveField('planned_start_at', tempDate);
      } catch (error) {
        setIsSavingDate(false);
        return;
      }
    }
    setIsSavingDate(false);
    setIsEditingDate(false);
  };

  const handleDateCancel = () => {
    if (isSavingDate) return;
    setIsEditingDate(false);
    setTempDate('');
  };

  // Handlers de ventana de tiempo
  const handleTimePreferenceClick = () => {
    if (canEdit('time_preference')) {
      setIsEditingStartTime(false);
      setIsEditingEndTime(false);
      setTempStartTime('');
      setTempEndTime('');
      setTempTimePreference(timePreference);
      setIsEditingTimePreference(true);
    }
  };

  const handleTimePreferenceSave = async () => {
    if (isSavingTimePreference) return;

    if (!onUpdateOrder) {
      return;
    }

    if (tempTimePreference === timePreference) {
      setIsEditingTimePreference(false);
      return;
    }

    setIsSavingTimePreference(true);
    try {
      if (tempTimePreference === 'no-preference') {
        await onUpdateOrder(order.id, {
          pickup_window_start: null,
          pickup_window_end: null
        });
        setTimePreference('no-preference');
      } else if (tempTimePreference === 'specific-time') {
        const time = order.pickup_window_start || '09:00';
        await onUpdateOrder(order.id, {
          pickup_window_start: time,
          pickup_window_end: time
        });
        setTimePreference('specific-time');
      } else if (tempTimePreference === 'time-window') {
        const startTime = order.pickup_window_start || '09:00';
        const endTime = order.pickup_window_end || '18:00';
        await onUpdateOrder(order.id, {
          pickup_window_start: startTime,
          pickup_window_end: endTime
        });
        setTimePreference('time-window');
      }

      setIsSavingTimePreference(false);
      setIsEditingTimePreference(false);
    } catch (error) {
      console.error('Error updating time preference:', error);
      setIsSavingTimePreference(false);
    }
  };

  const handleTimePreferenceCancel = () => {
    if (isSavingTimePreference) return;
    setIsEditingTimePreference(false);
    setTempTimePreference(timePreference);
  };

  // Handlers de hora de inicio
  const handleStartTimeClick = () => {
    if (canEdit('pickup_window_start') && !isEditingTimePreference) {
      setTempStartTime(order.pickup_window_start || '09:00');
      setIsEditingStartTime(true);
    }
  };

  const handleStartTimeSave = async () => {
    if (isSavingStartTime) return;

    if (tempStartTime && tempStartTime !== order.pickup_window_start) {
      setIsSavingStartTime(true);
      try {
        if (timePreference === 'specific-time') {
          await onUpdateOrder?.(order.id, {
            pickup_window_start: tempStartTime,
            pickup_window_end: tempStartTime
          });
        } else {
          await handleSaveField('pickup_window_start', tempStartTime);
        }
      } catch (error) {
        setIsSavingStartTime(false);
        return;
      }
    }
    setIsSavingStartTime(false);
    setIsEditingStartTime(false);
  };

  const handleStartTimeCancel = () => {
    if (isSavingStartTime) return;
    setIsEditingStartTime(false);
    setTempStartTime('');
  };

  // Handlers de hora de fin
  const handleEndTimeClick = () => {
    if (canEdit('pickup_window_end') && !isEditingTimePreference) {
      setTempEndTime(order.pickup_window_end || '18:00');
      setIsEditingEndTime(true);
    }
  };

  const handleEndTimeSave = async () => {
    if (isSavingEndTime) return;

    if (tempEndTime && tempEndTime !== order.pickup_window_end) {
      setIsSavingEndTime(true);
      try {
        await handleSaveField('pickup_window_end', tempEndTime);
      } catch (error) {
        setIsSavingEndTime(false);
        return;
      }
    }
    setIsSavingEndTime(false);
    setIsEditingEndTime(false);
  };

  const handleEndTimeCancel = () => {
    if (isSavingEndTime) return;
    setIsEditingEndTime(false);
    setTempEndTime('');
  };

  // Utilidades
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), "EEE dd MMM yyyy", { locale: es });
    } catch {
      return '-';
    }
  };

  const getDateInputValue = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), "yyyy-MM-dd");
    } catch {
      return '';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-gray-900">
          Programación
        </h3>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Fecha Prevista */}
          <div>
            <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
              Fecha Prevista
            </div>
            {isEditingDate ? (
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleDateSave();
                    if (e.key === 'Escape') handleDateCancel();
                  }}
                  autoFocus
                  className="flex-1 h-9 px-2 text-xs font-semibold text-gray-900 border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={handleDateSave}
                  disabled={isSavingDate}
                  className="flex items-center justify-center w-7 h-7 rounded hover:bg-green-50 text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Guardar"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDateCancel}
                  disabled={isSavingDate}
                  className="flex items-center justify-center w-7 h-7 rounded hover:bg-red-50 text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Cancelar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={handleDateClick}
                className={`text-xs font-semibold text-gray-900 ${canEdit('planned_start_at')
                    ? 'cursor-pointer rounded px-2 py-1 -mx-2 -my-1 transition-all hover:bg-gray-50 hover:ring-1 hover:ring-gray-200'
                    : ''
                  }`}
              >
                <div className={`flex items-center justify-between ${canEdit('planned_start_at') ? 'group' : ''}`}>
                  <span>{formatDate(order.planned_start_at)}</span>
                  {canEdit('planned_start_at') && (
                    <RefreshCw className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Ventana de Tiempo */}
          <div>
            <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
              Ventana de Tiempo
            </div>
            {isEditingTimePreference ? (
              <div className="flex items-center gap-1">
                <select
                  value={tempTimePreference}
                  onChange={(e) => setTempTimePreference(e.target.value as typeof tempTimePreference)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTimePreferenceSave();
                    if (e.key === 'Escape') handleTimePreferenceCancel();
                  }}
                  autoFocus
                  className="flex-1 h-9 px-2 text-xs font-semibold text-gray-900 border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                >
                  <option value="no-preference">Sin preferencia</option>
                  <option value="specific-time">Hora específica</option>
                  <option value="time-window">Rango horario</option>
                </select>
                <button
                  onClick={handleTimePreferenceSave}
                  disabled={isSavingTimePreference}
                  className="flex items-center justify-center w-7 h-7 rounded hover:bg-green-50 text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Guardar"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleTimePreferenceCancel}
                  disabled={isSavingTimePreference}
                  className="flex items-center justify-center w-7 h-7 rounded hover:bg-red-50 text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Cancelar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={handleTimePreferenceClick}
                className={`text-xs font-semibold text-gray-900 ${canEdit('time_preference')
                    ? 'cursor-pointer rounded px-2 py-1 -mx-2 -my-1 transition-all hover:bg-gray-50 hover:ring-1 hover:ring-gray-200'
                    : ''
                  }`}
              >
                <div className={`flex items-center justify-between ${canEdit('time_preference') ? 'group' : ''}`}>
                  <span>
                    {timePreference === 'no-preference' && 'Sin preferencia'}
                    {timePreference === 'specific-time' && 'Hora específica'}
                    {timePreference === 'time-window' && 'Rango horario'}
                  </span>
                  {canEdit('time_preference') && (
                    <RefreshCw className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hora Específica */}
        {timePreference === 'specific-time' && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                Hora Específica
              </div>
              {isEditingStartTime ? (
                <div className="flex items-center gap-1">
                  <input
                    type="time"
                    value={tempStartTime}
                    onChange={(e) => setTempStartTime(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleStartTimeSave();
                      if (e.key === 'Escape') handleStartTimeCancel();
                    }}
                    autoFocus
                    className="flex-1 h-9 px-2 text-xs font-semibold text-gray-900 border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={handleStartTimeSave}
                    disabled={isSavingStartTime}
                    className="flex items-center justify-center w-7 h-7 rounded hover:bg-green-50 text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Guardar"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleStartTimeCancel}
                    disabled={isSavingStartTime}
                    className="flex items-center justify-center w-7 h-7 rounded hover:bg-red-50 text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Cancelar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={handleStartTimeClick}
                  className={`text-xs font-semibold text-gray-900 ${canEdit('pickup_window_start') && !isEditingTimePreference
                      ? 'cursor-pointer rounded px-2 py-1 -mx-2 -my-1 transition-all hover:bg-gray-50 hover:ring-1 hover:ring-gray-200'
                      : isEditingTimePreference
                        ? 'opacity-50'
                        : ''
                    }`}
                >
                  <div className={`flex items-center justify-between ${canEdit('pickup_window_start') && !isEditingTimePreference ? 'group' : ''}`}>
                    <span>{order.pickup_window_start || '-'}</span>
                    {canEdit('pickup_window_start') && !isEditingTimePreference && (
                      <RefreshCw className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>
              )}
            </div>
            <div />
          </div>
        )}

        {/* Rango Horario */}
        {timePreference === 'time-window' && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                Hora Inicio
              </div>
              {isEditingStartTime ? (
                <div className="flex items-center gap-1">
                  <input
                    type="time"
                    value={tempStartTime}
                    onChange={(e) => setTempStartTime(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleStartTimeSave();
                      if (e.key === 'Escape') handleStartTimeCancel();
                    }}
                    autoFocus
                    className="flex-1 h-9 px-2 text-xs font-semibold text-gray-900 border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={handleStartTimeSave}
                    disabled={isSavingStartTime}
                    className="flex items-center justify-center w-7 h-7 rounded hover:bg-green-50 text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Guardar"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleStartTimeCancel}
                    disabled={isSavingStartTime}
                    className="flex items-center justify-center w-7 h-7 rounded hover:bg-red-50 text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Cancelar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={handleStartTimeClick}
                  className={`text-xs font-semibold text-gray-900 ${canEdit('pickup_window_start') && !isEditingTimePreference
                      ? 'cursor-pointer rounded px-2 py-1 -mx-2 -my-1 transition-all hover:bg-gray-50 hover:ring-1 hover:ring-gray-200'
                      : isEditingTimePreference
                        ? 'opacity-50'
                        : ''
                    }`}
                >
                  <div className={`flex items-center justify-between ${canEdit('pickup_window_start') && !isEditingTimePreference ? 'group' : ''}`}>
                    <span>{order.pickup_window_start || '-'}</span>
                    {canEdit('pickup_window_start') && !isEditingTimePreference && (
                      <RefreshCw className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>
              )}
            </div>
            <div>
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                Hora Fin
              </div>
              {isEditingEndTime ? (
                <div className="flex items-center gap-1">
                  <input
                    type="time"
                    value={tempEndTime}
                    onChange={(e) => setTempEndTime(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEndTimeSave();
                      if (e.key === 'Escape') handleEndTimeCancel();
                    }}
                    autoFocus
                    className="flex-1 h-9 px-2 text-xs font-semibold text-gray-900 border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={handleEndTimeSave}
                    disabled={isSavingEndTime}
                    className="flex items-center justify-center w-7 h-7 rounded hover:bg-green-50 text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Guardar"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleEndTimeCancel}
                    disabled={isSavingEndTime}
                    className="flex items-center justify-center w-7 h-7 rounded hover:bg-red-50 text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Cancelar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={handleEndTimeClick}
                  className={`text-xs font-semibold text-gray-900 ${canEdit('pickup_window_end') && !isEditingTimePreference
                      ? 'cursor-pointer rounded px-2 py-1 -mx-2 -my-1 transition-all hover:bg-gray-50 hover:ring-1 hover:ring-gray-200'
                      : isEditingTimePreference
                        ? 'opacity-50'
                        : ''
                    }`}
                >
                  <div className={`flex items-center justify-between ${canEdit('pickup_window_end') && !isEditingTimePreference ? 'group' : ''}`}>
                    <span>{order.pickup_window_end || '-'}</span>
                    {canEdit('pickup_window_end') && !isEditingTimePreference && (
                      <RefreshCw className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
