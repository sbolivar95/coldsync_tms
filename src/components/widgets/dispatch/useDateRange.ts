import { useState, useMemo } from "react";

/**
 * Hook para manejar rangos de fechas en componentes de timeline/calendario
 * 
 * @example
 * ```tsx
 * const { days, currentDate, goToPrevious, goToNext } = useDateRange({
 *   startDate: new Date(),
 *   numDays: 15,
 *   onDateChange: (date) => console.log(date)
 * });
 * ```
 */

export interface DayInfo {
  dayName: string;
  dayNumber: number;
  month: string;
  fullDate: Date;
}

export interface UseDateRangeOptions {
  /** Fecha inicial del rango */
  startDate?: Date;
  /** Número de días a generar */
  numDays?: number;
  /** Callback cuando cambia la fecha */
  onDateChange?: (date: Date) => void;
}

export function useDateRange({
  startDate = new Date(),
  numDays = 15,
  onDateChange,
}: UseDateRangeOptions = {}) {
  const [currentStartDate, setCurrentStartDate] = useState(startDate);

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const monthNames = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];

  const days = useMemo<DayInfo[]>(() => {
    const daysArray: DayInfo[] = [];
    for (let i = 0; i < numDays; i++) {
      const date = new Date(currentStartDate);
      date.setDate(currentStartDate.getDate() + i);
      daysArray.push({
        dayName: dayNames[date.getDay()],
        dayNumber: date.getDate(),
        month: monthNames[date.getMonth()],
        fullDate: date,
      });
    }
    return daysArray;
  }, [currentStartDate, numDays]);

  const goToPrevious = () => {
    const newDate = new Date(currentStartDate);
    newDate.setDate(currentStartDate.getDate() - 1);
    setCurrentStartDate(newDate);
    onDateChange?.(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentStartDate);
    newDate.setDate(currentStartDate.getDate() + 1);
    setCurrentStartDate(newDate);
    onDateChange?.(newDate);
  };

  return {
    days,
    currentDate: currentStartDate,
    goToPrevious,
    goToNext,
    setCurrentDate: (date: Date) => {
      setCurrentStartDate(date);
      onDateChange?.(date);
    },
  };
}
