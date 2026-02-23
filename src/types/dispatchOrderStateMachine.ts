/**
 * Dispatch Order State Machine
 * 
 * Central source of truth for:
 * - Stage and substatus enums
 * - Valid transitions between stages/substates
 * - Display configuration (labels, colors, icons)
 * - Stage → substatus mapping
 * 
 * @see docs/business/state-orders.md
 */

import type { DispatchOrderStage, DispatchOrderSubstatus } from './dispatch.types';

// ─── Stage → Substatus Mapping ──────────────────────────────────────────────

/** Which substates belong to each stage */
export const STAGE_SUBSTATUS_MAP: Record<DispatchOrderStage, DispatchOrderSubstatus[]> = {
  DISPATCH: ['NEW', 'UNASSIGNED', 'ASSIGNED'],
  TENDERS: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
  SCHEDULED: ['PROGRAMMED', 'DISPATCHED', 'EN_ROUTE_TO_ORIGIN', 'AT_ORIGIN', 'LOADING', 'OBSERVED'],
  EXECUTION: ['IN_TRANSIT', 'AT_DESTINATION', 'DELIVERED'],
  CONCILIATION: ['PENDING_AUDIT', 'UNDER_REVIEW', 'DISPUTED', 'APPROVED', 'CLOSED'],
};

/** Derive stage from substatus (reverse lookup). CANCELED is special — it keeps its current stage. */
export function getStageForSubstatus(substatus: DispatchOrderSubstatus): DispatchOrderStage | null {
  if (substatus === 'CANCELED') return null; // Canceled keeps its current stage
  for (const [stage, substates] of Object.entries(STAGE_SUBSTATUS_MAP)) {
    if ((substates as DispatchOrderSubstatus[]).includes(substatus)) {
      return stage as DispatchOrderStage;
    }
  }
  return null;
}

// ─── Valid Transitions ──────────────────────────────────────────────────────

export interface StateTransition {
  toStage: DispatchOrderStage;
  toSubstatus: DispatchOrderSubstatus;
}

/**
 * Valid transitions from each substatus.
 * Key = current substatus → Value = array of valid next states.
 */
export const VALID_TRANSITIONS: Record<DispatchOrderSubstatus, StateTransition[]> = {
  // DISPATCH stage
  NEW: [
    { toStage: 'DISPATCH', toSubstatus: 'ASSIGNED' },
    { toStage: 'DISPATCH', toSubstatus: 'CANCELED' },
  ],
  UNASSIGNED: [
    { toStage: 'DISPATCH', toSubstatus: 'ASSIGNED' },
    { toStage: 'DISPATCH', toSubstatus: 'CANCELED' },
  ],
  ASSIGNED: [
    { toStage: 'DISPATCH', toSubstatus: 'UNASSIGNED' },
    { toStage: 'TENDERS', toSubstatus: 'PENDING' },
    { toStage: 'DISPATCH', toSubstatus: 'CANCELED' },
  ],
  // TENDERS stage
  PENDING: [
    { toStage: 'TENDERS', toSubstatus: 'ACCEPTED' },
    { toStage: 'TENDERS', toSubstatus: 'REJECTED' },
    { toStage: 'TENDERS', toSubstatus: 'EXPIRED' },
    { toStage: 'TENDERS', toSubstatus: 'CANCELED' },
  ],
  ACCEPTED: [
    { toStage: 'SCHEDULED', toSubstatus: 'PROGRAMMED' },
  ],
  REJECTED: [
    { toStage: 'DISPATCH', toSubstatus: 'UNASSIGNED' },
  ],
  EXPIRED: [
    { toStage: 'DISPATCH', toSubstatus: 'UNASSIGNED' },
  ],
  // SCHEDULED stage
  PROGRAMMED: [
    { toStage: 'SCHEDULED', toSubstatus: 'DISPATCHED' },
    { toStage: 'SCHEDULED', toSubstatus: 'CANCELED' },
  ],
  DISPATCHED: [
    { toStage: 'SCHEDULED', toSubstatus: 'EN_ROUTE_TO_ORIGIN' },
    { toStage: 'SCHEDULED', toSubstatus: 'CANCELED' },
  ],
  EN_ROUTE_TO_ORIGIN: [
    { toStage: 'SCHEDULED', toSubstatus: 'AT_ORIGIN' },
    { toStage: 'SCHEDULED', toSubstatus: 'CANCELED' },
  ],
  AT_ORIGIN: [
    { toStage: 'SCHEDULED', toSubstatus: 'LOADING' },
    { toStage: 'SCHEDULED', toSubstatus: 'OBSERVED' },
    { toStage: 'SCHEDULED', toSubstatus: 'CANCELED' },
  ],
  LOADING: [
    { toStage: 'EXECUTION', toSubstatus: 'IN_TRANSIT' },
  ],
  OBSERVED: [
    { toStage: 'SCHEDULED', toSubstatus: 'LOADING' },
    { toStage: 'SCHEDULED', toSubstatus: 'AT_ORIGIN' },
    { toStage: 'DISPATCH', toSubstatus: 'UNASSIGNED' },
    { toStage: 'SCHEDULED', toSubstatus: 'CANCELED' },
  ],
  // EXECUTION stage (not cancelable)
  IN_TRANSIT: [
    { toStage: 'EXECUTION', toSubstatus: 'AT_DESTINATION' },
  ],
  AT_DESTINATION: [
    { toStage: 'EXECUTION', toSubstatus: 'DELIVERED' },
  ],
  DELIVERED: [
    { toStage: 'CONCILIATION', toSubstatus: 'PENDING_AUDIT' },
  ],
  // CONCILIATION stage (not cancelable)
  PENDING_AUDIT: [
    { toStage: 'CONCILIATION', toSubstatus: 'APPROVED' },
    { toStage: 'CONCILIATION', toSubstatus: 'UNDER_REVIEW' },
  ],
  UNDER_REVIEW: [
    { toStage: 'CONCILIATION', toSubstatus: 'DISPUTED' },
    { toStage: 'CONCILIATION', toSubstatus: 'APPROVED' },
  ],
  DISPUTED: [
    { toStage: 'CONCILIATION', toSubstatus: 'APPROVED' },
  ],
  APPROVED: [
    { toStage: 'CONCILIATION', toSubstatus: 'CLOSED' },
  ],
  CLOSED: [],
  CANCELED: [],
};

/**
 * Validates whether a transition from one substatus to another is allowed.
 */
export function isValidTransition(
  fromSubstatus: DispatchOrderSubstatus,
  toStage: DispatchOrderStage,
  toSubstatus: DispatchOrderSubstatus
): boolean {
  const transitions = VALID_TRANSITIONS[fromSubstatus];
  return transitions.some(t => t.toStage === toStage && t.toSubstatus === toSubstatus);
}

// ─── Cancelability ──────────────────────────────────────────────────────────

/** Stages where cancellation is allowed */
const CANCELABLE_STAGES: Set<DispatchOrderStage> = new Set(['DISPATCH', 'TENDERS', 'SCHEDULED']);

export function isCancelable(stage: DispatchOrderStage): boolean {
  return CANCELABLE_STAGES.has(stage);
}

// ─── Display Configuration ──────────────────────────────────────────────────

export interface SubstatusDisplayConfig {
  label: string;
  color: string;
  /** Badge background color (lighter variant for badges) */
  bgColor: string;
}

/**
 * Display configuration for each substatus.
 * Labels are in Spanish to match the app's locale.
 */
export const SUBSTATUS_DISPLAY: Record<DispatchOrderSubstatus, SubstatusDisplayConfig> = {
  // DISPATCH
  NEW: { label: 'Nueva', color: '#6b7280', bgColor: '#f3f4f6' },
  UNASSIGNED: { label: 'Sin Asignar', color: '#6b7280', bgColor: '#f3f4f6' },
  ASSIGNED: { label: 'Asignada', color: '#3b82f6', bgColor: '#eff6ff' },
  // TENDERS / ORDERS
  PENDING: { label: 'Pendiente', color: '#3b82f6', bgColor: '#eff6ff' },
  ACCEPTED: { label: 'Aceptada', color: '#10b981', bgColor: '#ecfdf5' },
  REJECTED: { label: 'Rechazada', color: '#6b7280', bgColor: '#f3f4f6' },
  EXPIRED: { label: 'Expirada', color: '#6b7280', bgColor: '#f3f4f6' },
  // SCHEDULED
  PROGRAMMED: { label: 'Programada', color: '#10b981', bgColor: '#ecfdf5' },
  DISPATCHED: { label: 'Despachada', color: '#3b82f6', bgColor: '#eff6ff' },
  EN_ROUTE_TO_ORIGIN: { label: 'En Ruta a Origen', color: '#8b5cf6', bgColor: '#f5f3ff' },
  AT_ORIGIN: { label: 'En Origen', color: '#8b5cf6', bgColor: '#f5f3ff' },
  LOADING: { label: 'Cargando', color: '#06b6d4', bgColor: '#ecfeff' },
  OBSERVED: { label: 'Observada', color: '#f59e0b', bgColor: '#fffbeb' },
  // EXECUTION
  IN_TRANSIT: { label: 'En Ruta', color: '#06b6d4', bgColor: '#ecfeff' },
  AT_DESTINATION: { label: 'En Destino', color: '#14b8a6', bgColor: '#f0fdfa' },
  DELIVERED: { label: 'Entregada', color: '#10b981', bgColor: '#ecfdf5' },
  // CONCILIATION
  PENDING_AUDIT: { label: 'Pendiente Auditoría', color: '#f59e0b', bgColor: '#fffbeb' },
  UNDER_REVIEW: { label: 'En Revisión', color: '#8b5cf6', bgColor: '#f5f3ff' },
  DISPUTED: { label: 'Disputada', color: '#ef4444', bgColor: '#fef2f2' },
  APPROVED: { label: 'Aprobada', color: '#10b981', bgColor: '#ecfdf5' },
  CLOSED: { label: 'Cerrada', color: '#6b7280', bgColor: '#f3f4f6' },
  CANCELED: { label: 'Cancelada', color: '#6b7280', bgColor: '#f3f4f6' },
};

export interface StageDisplayConfig {
  label: string;
  color: string;
}

/**
 * Display configuration for each stage.
 */
export const STAGE_DISPLAY: Record<DispatchOrderStage, StageDisplayConfig> = {
  DISPATCH: { label: 'Despacho', color: '#3b82f6' },
  TENDERS: { label: 'Licitación', color: '#f59e0b' },
  SCHEDULED: { label: 'Programación', color: '#8b5cf6' },
  EXECUTION: { label: 'Ejecución', color: '#06b6d4' },
  CONCILIATION: { label: 'Conciliación', color: '#10b981' },
};

/**
 * Get display config for a substatus, with fallback.
 */
export function getSubstatusDisplay(substatus: DispatchOrderSubstatus): SubstatusDisplayConfig {
  return SUBSTATUS_DISPLAY[substatus] || { label: substatus, color: '#6b7280', bgColor: '#f3f4f6' };
}

/**
 * Get display config for a stage, with fallback.
 */
export function getStageDisplay(stage: DispatchOrderStage): StageDisplayConfig {
  return STAGE_DISPLAY[stage] || { label: stage, color: '#6b7280' };
}


