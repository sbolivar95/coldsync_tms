/**
 * DISPATCH UTILS - ColdSync
 * 
 * Funciones de utilidad compartidas para el módulo de despacho.
 */

/**
 * Obtiene las clases de CSS para el indicador de estado (punto) de una unidad.
 * @param status Estado en español (ej: "En Ruta")
 * @param hasActiveTrip Si la unidad tiene un viaje asignado en este momento
 */
export const getStatusDotClasses = (status: string, hasActiveTrip: boolean): string => {
    // Si no tiene viaje activo, mostrar círculo outline gris
    if (!hasActiveTrip) {
        return "fill-none stroke-gray-400 stroke-[1.5]";
    }

    // Si tiene viaje activo, mostrar color según estado
    switch (status) {
        case "En Ruta":
            return "fill-tracking-driving text-tracking-driving";
        case "Detenido":
            return "fill-tracking-stopped text-tracking-stopped";
        case "En Planta":
            return "fill-tracking-idle text-tracking-idle";
        default:
            return "fill-tracking-offline text-tracking-offline";
    }
};

/**
 * Colores por defecto para las configuraciones de carga.
 */
export const CONFIG_COLORS: Record<string, string> = {
    Congelado: "#dc2626", // Rojo
    Refrigerado: "#22c55e", // Verde
    Seco: "#ec4899", // Rosa
    Standard: "#3b82f6", // Azul (fallback)
};

/**
 * Obtiene el color asociado a una configuración de carga.
 */
export const getColorByConfig = (config: string): string => {
    return CONFIG_COLORS[config] || CONFIG_COLORS.Standard;
};
