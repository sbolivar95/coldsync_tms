# 📊 Scorecard de Carril y Carrier (KPIs)

Este documento describe el sistema de puntuación ponderada para evaluar el desempeño de los transportistas dentro de la red de **Line Haul**, enfocado en la integridad de los carriles logísticos.

---

## 📋 Tabla de Contenidos

1. [Visión General: Calidad en la Red](#visión-general)
2. [Criterios de Desempeño Logístico](#criterios-y-fórmulas)
3. [Impacto en la Planificación (Allocation)](#impacto-en-allocation)

---

## 🎯 Visión General

El Scorecard de ColdSync es la herramienta del pilar de **Planificación** para tomar decisiones de asignación basadas en datos. Evalúa la capacidad estratégica del carrier para mantener la cadena de frío en carriles (lanes) de larga distancia, resultando en un valor de cumplimiento (Health Score) entre 0 y 100.

## Criterios y Fórmulas

| Indicador                    | Peso    | Definición y Fórmula                                                                                                                                                              |
| :--------------------------- | :------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **% Ejecución**              | **15%** | $Viajes \ Ejecutados \ / \ Viajes \ Programados$                                                                                                                                  |
| **Cumplimiento Plazos Adm.** | **5%**  | Escala:<br>100% (Antes del plazo)<br>70% (Fuera de plazo aceptable)<br>40% (Con perjuicio)<br>0% (Continuamente fuera)                                                            |
| **% Rechazos**               | **10%** | $(Viajes \ Programados \ - \ Nº \ Rechazos \ Checklist) \ / \ Viajes \ Programados$                                                                                               |
| **% ON TIME (EAL)**          | **20%** | Basado en ETA a destino:<br>< 36h: 100%<br>< 38h: 80%<br>< 40h: 50%<br>>= 40h: 0%                                                                                                 |
| **FR CRÍTICO**               | **25%** | Viajes con excursión térmica crítica (Fuera de Rango).<br>Fórmula: $(Viajes \ Ejecutados \ - \ (Viajes \ FR \ Crítico \ \times \ 6)) \ / \ Viajes \ Ejecutados$                   |
| **FR MEDIO**                 | **10%** | Fórmula: $(Viajes \ Ejecutados \ - \ (Viajes \ FR \ Medio \ \times \ 3)) \ / \ Viajes \ Ejecutados$                                                                               |
| **FR LEVE**                  | **5%**  | Fórmula: $(Viajes \ Ejecutados \ - \ Viajes \ FR \ Leve) \ / \ Viajes \ Ejecutados$                                                                                               |
| **SNC / PNC**                | **10%** | Servicio o Producto No Conforme.<br>_(Nota: En viajes de producto seco, este peso sube al 50%)_.<br>Fórmula: $(Viajes \ Ejecutados \ - \ Viajes \ SNC) \ / \ Viajes \ Ejecutados$ |
| **% Entrega de Notificaciones Email** | **5%** | Calculado vía webhooks de Resend: delivered / sent. Impacta positivamente el puntaje global cuando >98%. |

## 📝 Notas y Definiciones

- **FR = Falla de Rango** (excursión térmica)
- **SNC = Servicio No Conforme**
- **PNC = Producto No Conforme**
- **EAL = Estimated Arrival Time** (Tiempo Estimado de Llegada)

---

## 🔗 Referencias

- [Despacho](./dispatch.md) - Origen de los viajes programados
- [Torre de Control](./control-tower.md) - Fuente de datos de cumplimiento térmico
- [Conciliación](./reconciliation.md) - Proceso de auditoría
- [Visión General](./README.md) - Macroprocesos del sistema

---

**Última actualización:** Diciembre 2024

