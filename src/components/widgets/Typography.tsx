/**
 * Typography Components - Tailwind v4 Puro
 * Componentes reutilizables para evitar repetir clases de tipografía
 */

import { ReactNode } from "react";

interface TypographyProps {
  children: ReactNode;
  className?: string;
}

/**
 * Título principal de página (H1)
 * Uso: <PageTitle>Dashboard</PageTitle>
 */
export function PageTitle({ children, className = "" }: TypographyProps) {
  return (
    <h1 className={`text-2xl font-medium ${className}`}>
      {children}
    </h1>
  );
}

/**
 * Título de sección (H2)
 * Uso: <SectionTitle>Información General</SectionTitle>
 */
export function SectionTitle({ children, className = "" }: TypographyProps) {
  return (
    <h2 className={`text-xl font-medium ${className}`}>
      {children}
    </h2>
  );
}

/**
 * Subtítulo (H3)
 * Uso: <SubTitle>Detalles del Vehículo</SubTitle>
 */
export function SubTitle({ children, className = "" }: TypographyProps) {
  return (
    <h3 className={`text-lg font-medium ${className}`}>
      {children}
    </h3>
  );
}

/**
 * Texto de cuerpo
 * Uso: <BodyText>Descripción del contenido...</BodyText>
 */
export function BodyText({ children, className = "" }: TypographyProps) {
  return (
    <p className={`text-sm ${className}`}>
      {children}
    </p>
  );
}

/**
 * Texto pequeño / Caption
 * Uso: <Caption>Última actualización: hace 5 minutos</Caption>
 */
export function Caption({ children, className = "" }: TypographyProps) {
  return (
    <p className={`text-xs text-gray-500 ${className}`}>
      {children}
    </p>
  );
}
