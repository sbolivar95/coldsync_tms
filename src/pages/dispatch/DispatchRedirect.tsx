import { Navigate } from 'react-router-dom';
import { useAppStore } from '../../stores/useAppStore';

/**
 * DispatchRedirect - Redirige a la vista preferida del usuario
 * 
 * Usa la preferencia guardada en Zustand para determinar si mostrar
 * la vista de lista o gantt por defecto.
 */
export function DispatchRedirect() {
  const dispatchViewPreference = useAppStore((state) => state.dispatchViewPreference);
  
  return <Navigate to={`/dispatch/${dispatchViewPreference}`} replace />;
}
