import type { DispatchOrderWithRelations } from '../hooks/useDispatchOrders';
import type { DispatchOrderSubstatus, DispatchOrderStage } from '../../../types/database.types';
import {
  getSubstatusDisplay,
  getStageDisplay,
  type SubstatusDisplayConfig,
  type StageDisplayConfig,
} from '../../../types/dispatchOrderStateMachine';

/**
 * Calcula el tiempo restante para TTL dinámico
 */
export const getTTLRemaining = (
  tenderCreatedAt: string,
  expectedDate: string,
  expectedTime: string,
  responseDeadline?: string | null
): string => {
  const now = new Date();
  
  // Si hay response_deadline explícito, usarlo
  if (responseDeadline) {
    const deadline = new Date(responseDeadline);
    const diff = deadline.getTime() - now.getTime();
    
    if (diff <= 0) return "Expirado";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }
  
  // Calcular TTL dinámico basado en anticipación
  const tenderDate = new Date(tenderCreatedAt);
  const pickupDate = new Date(`${expectedDate}T${expectedTime}`);
  const anticipationHours = (pickupDate.getTime() - tenderDate.getTime()) / (1000 * 60 * 60);
  
  let ttlHours: number;
  if (anticipationHours <= 24) {
    ttlHours = 1.5; // 90 minutos
  } else if (anticipationHours <= 72) {
    ttlHours = 24;
  } else if (anticipationHours <= 168) {
    ttlHours = 48;
  } else {
    ttlHours = 72;
  }
  
  const deadline = new Date(tenderDate.getTime() + ttlHours * 60 * 60 * 1000);
  const diff = deadline.getTime() - now.getTime();
  
  if (diff <= 0) return "Expirado";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

/**
 * Determina la urgencia basada en el TTL restante
 */
export const getTTLUrgency = (ttlRemaining: string): 'normal' | 'high' | 'critical' => {
  if (ttlRemaining === "Expirado") return 'critical';
  
  // Extraer horas del string
  const hoursMatch = ttlRemaining.match(/(\d+)h/);
  const minutesMatch = ttlRemaining.match(/(\d+)m/);
  const daysMatch = ttlRemaining.match(/(\d+)d/);
  
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
  const days = daysMatch ? parseInt(daysMatch[1]) : 0;
  
  const totalMinutes = days * 24 * 60 + hours * 60 + minutes;
  
  if (totalMinutes <= 60) return 'critical'; // Menos de 1 hora
  if (totalMinutes <= 180) return 'high'; // Menos de 3 horas
  return 'normal';
};

/**
 * Calcula el tiempo transcurrido desde una decisión
 */
export const getTimeSinceDecision = (decisionTimestamp: string): string => {
  const now = new Date();
  const decision = new Date(decisionTimestamp);
  const diff = now.getTime() - decision.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `Hace ${days}d`;
  }
  
  if (hours > 0) {
    return `Hace ${hours}h ${minutes}m`;
  }
  
  return `Hace ${minutes}m`;
};

/**
 * Gets display config for a substatus (new state model).
 */
export const getSubstatusConfig = (substatus: DispatchOrderSubstatus): SubstatusDisplayConfig => {
  return getSubstatusDisplay(substatus);
};

/**
 * Gets display config for a stage (new state model).
 */
export const getStageConfig = (stage: DispatchOrderStage): StageDisplayConfig => {
  return getStageDisplay(stage);
};

/**
 * Gets full display info for the new state model.
 * Combines stage + substatus for comprehensive status display.
 */
export const getDispatchStateDisplay = (
  order: DispatchOrderWithRelations,
  tenderCreatedAt?: string,
  decisionTimestamp?: string
): {
  label: string;
  stageLabel: string;
  timeInfo: string;
  urgency: 'normal' | 'high' | 'critical';
  dotColor: string;
  bgColor: string;
} => {
  const substatus = order.substatus;
  const stage = order.stage;

  const substatusConfig = getSubstatusDisplay(substatus);
  const stageConfig = getStageDisplay(stage);

  // TENDERS/PENDING — show TTL
  if (substatus === 'PENDING') {
    if (tenderCreatedAt && order.planned_start_at) {
      const pickupDate = new Date(order.planned_start_at);
      const expectedDate = pickupDate.toISOString().split('T')[0];
      const expectedTime = pickupDate.toTimeString().split(' ')[0].substring(0, 5);

      const ttlRemaining = getTTLRemaining(
        tenderCreatedAt,
        expectedDate,
        expectedTime,
        order.response_deadline
      );
      const urgency = getTTLUrgency(ttlRemaining);

      return {
        label: substatusConfig.label,
        stageLabel: stageConfig.label,
        timeInfo: ttlRemaining === "Expirado" ? "Expiró" : `Vence en ${ttlRemaining}`,
        urgency,
        dotColor: urgency === 'critical' ? '#ef4444' : urgency === 'high' ? '#f59e0b' : substatusConfig.color,
        bgColor: substatusConfig.bgColor,
      };
    }
  }

  // REJECTED, CANCELED, EXPIRED — show time since decision
  if (['REJECTED', 'CANCELED', 'EXPIRED'].includes(substatus) && decisionTimestamp) {
    return {
      label: substatusConfig.label,
      stageLabel: stageConfig.label,
      timeInfo: getTimeSinceDecision(decisionTimestamp),
      urgency: 'normal',
      dotColor: substatusConfig.color,
      bgColor: substatusConfig.bgColor,
    };
  }

  // OBSERVED — show time since observation
  if (substatus === 'OBSERVED' && decisionTimestamp) {
    return {
      label: substatusConfig.label,
      stageLabel: stageConfig.label,
      timeInfo: getTimeSinceDecision(decisionTimestamp),
      urgency: 'normal',
      dotColor: substatusConfig.color,
      bgColor: substatusConfig.bgColor,
    };
  }

  // Default — no time info
  return {
    label: substatusConfig.label,
    stageLabel: stageConfig.label,
    timeInfo: '',
    urgency: 'normal',
    dotColor: substatusConfig.color,
    bgColor: substatusConfig.bgColor,
  };
};
