/**
 * Z-Index Hierarchy Constants
 * 
 * Mantener esta jerarquía para evitar conflictos de apilamiento (stacking context).
 * Los valores más altos siempre aparecen por encima de los más bajos.
 */

export const Z_INDEX = {
  // Base elements (backgrounds, decorative lines)
  BACKGROUND: 1,
  BASE: 10,
  
  // Layout elements (sidebars, panels)
  SIDEBAR: 20,
  PANEL: 20,
  
  // Sticky headers and interactive elements
  STICKY_HEADER: 30,
  GANTT_HEADER: 40,
  
  // Overlays and popovers (Radix UI components)
  POPOVER: 50,
  DROPDOWN: 50,
  TOOLTIP: 50,
  SELECT: 50,
  DIALOG: 50,
  DRAWER: 50,
  SHEET: 50,
  
  // Critical modals (require user decision)
  ALERT_DIALOG: 100,
  
  // Absolute top (notifications, critical alerts)
  TOAST: 200,
} as const;

/**
 * Uso:
 * 
 * import { Z_INDEX } from '@/lib/constants/z-index.constants';
 * 
 * // En Tailwind classes
 * className="z-[var(--z-alert-dialog)]"
 * 
 * // En inline styles
 * style={{ zIndex: Z_INDEX.ALERT_DIALOG }}
 */
