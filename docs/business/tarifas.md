# Tarifas (Rate Cards)

Este documento describe cómo funcionan los tarifarios en el sistema: qué son, cómo se configuran y cómo se calcula el costo de un despacho.

---

## 1. ¿Qué es un tarifario?

Un **tarifario** (rate card) es una plantilla de precios asociada a un **carril** (origen–destino). Define:

- **Cargo mínimo**: el monto mínimo que se cobra por un viaje en ese carril, sin importar el resultado del cálculo.
- **Cargos**: una lista ordenada de conceptos (flete, distancia, combustible, etc.), cada uno con su **tipo de cargo**, **base de cálculo** y **valor** (o escalones, cuando aplica).

El sistema usa un solo tarifario por despacho. Ese tarifario se elige en función del carril, el transportista y el perfil térmico del producto (ver sección 2).

---

## 2. Selección del tarifario

Para un despacho se tienen:

- **Carril** (obligatorio)
- **Transportista**
- **Productos** (con cantidad y, opcionalmente, perfil térmico)

El tarifario aplicable se resuelve en este orden:

1. Tarifario del **transportista** del despacho + **perfil térmico** que coincida con el producto.
2. Tarifario del **transportista** con **perfil térmico “cualquiera”** (sin perfil específico).
3. Tarifario **por defecto de la organización** (sin transportista específico) + **perfil térmico** que coincida.
4. Tarifario **por defecto de la organización** con **perfil térmico “cualquiera”**.

Solo se consideran tarifarios **activos** y que pertenezcan al mismo **carril** del despacho.

---

## 3. Cargo mínimo

- **Cargo mínimo** es un campo del tarifario (no un cargo más en la lista).
- Después de sumar todos los cargos, el **costo total** es:
  - **Total = máximo( Subtotal de cargos , Cargo mínimo )**
- Si el subtotal da menos que el cargo mínimo, se cobra el cargo mínimo.
- Ejemplo: cargo mínimo $200, subtotal calculado $150 → se cobra $200.

---

## 4. Tipos de cargo (Tipo de Cargos)

El **tipo de cargo** es una etiqueta del concepto (flete, distancia, combustible). No cambia la fórmula; sirve para clasificar y reportar (por ejemplo, “flete” vs “combustible”).

Los tipos disponibles en la configuración son:

| Tipo        | Nombre en UI   | Uso típico |
|------------|----------------|------------|
| **FREIGHT**  | Flete          | Tarifa principal por el transporte de la carga (por tonelada, fijo, etc.). |
| **DISTANCE** | Distancia     | Cargo por kilómetro recorrido en el carril. |
| **FUEL**     | Combustible   | Recargo por combustible, normalmente como **porcentaje** sobre un subtotal. |

Nota: el sistema puede seguir mostrando “Base” en datos antiguos; en tarifarios nuevos ya no se usa ese tipo.

---

## 5. Base de cálculo (Base de Cálculo)

La **base de cálculo** define **cómo** se obtiene el monto del cargo a partir del **valor** (o del escalón, si es por tonelada). Las dimensiones que usa el sistema son:

- **Peso total** (toneladas) de la orden.
- **Distancia** (km) del carril.
- **Tiempo de tránsito** y **cantidad de paradas** (si en el futuro se usan en más cargos).

### 5.1 Fijo (FLAT)

- **Fórmula:** Monto = **Valor** (el número que se configura).
- No depende de peso ni distancia.
- **Ejemplo:** Valor $50 → el cargo siempre suma $50.

### 5.2 Por tonelada (PER_TN)

- **Fórmula:** Monto = **Tarifa efectiva** × **Peso total (tn)**.
- La “tarifa efectiva” puede ser:
  - El **Valor** del cargo, si no hay escalones, o
  - El **rate_value** del escalón que corresponda al peso (ver sección 6).
- **Ejemplo:** Valor $100/tn, 3 tn → 100 × 3 = $300.

### 5.3 Por kilómetro (PER_KM)

- **Fórmula:** Monto = **Valor** × **Distancia (km)** del carril.
- **Ejemplo:** Valor $2/km, 500 km → 2 × 500 = $1.000.

### 5.4 Porcentaje (PERCENTAGE)

- **Fórmula:** Monto = **Subtotal para %** × ( **Valor** / 100 ).
- El **Subtotal para %** es la suma de los cargos que tienen marcado **“Aplicar antes de porcentajes”** y que ya se procesaron antes de este cargo en el orden del tarifario.
- **Ejemplo:** Valor 10%, subtotal para % = $1.000 → 1.000 × 0,10 = $100.

---

## 6. Escalones (Por tonelada con rangos)

Solo los cargos con base **Por tonelada (PER_TN)** pueden usar **escalones**.

- Cada escalón define un **rango de peso** (Desde tn – Hasta tn) y una **Tarifa** ($/tn) para ese rango.
- Los rangos no deben solaparse (ej.: 0–5 tn y 5–10 tn está bien; 0–5 y 4–10 no).
- Para un peso dado se busca el escalón que lo contenga y se usa su tarifa:
  - **Monto = Tarifa del escalón × Peso total.**

Ejemplo de escalones:

| Desde (tn) | Hasta (tn) | Tarifa ($/tn) |
|------------|------------|----------------|
| 0          | 5          | 120            |
| 5          | 10         | 100            |
| 10         | (sin límite)| 80            |

- 3 tn → 120 × 3 = $360  
- 7 tn → 100 × 7 = $700  
- 12 tn → 80 × 12 = $960  

---

## 7. Orden de los cargos y “Aplicar antes de porcentajes”

- Los cargos se procesan en el **orden** definido en el tarifario (sort_order).
- La casilla **“Aplicar antes de porcentajes”** solo importa para cargos que **no** son de tipo Porcentaje:
  - Si está marcada, el monto de ese cargo se suma al **subtotal sobre el que se calculan después los cargos en %**.
  - Los cargos con base **Porcentaje** siempre usan ese subtotal acumulado (solo incluyen cargos ya procesados que “aplican antes de %”).

Así puedes definir, por ejemplo: primero flete (fijo o por tn) y distancia, y luego un recargo de combustible como % sobre ese subtotal.

---

## 8. Resumen del cálculo

1. Se obtienen **dimensiones**: peso total (tn), distancia (km) del carril y, si aplica, tiempo y paradas.
2. Se **elige el tarifario** según carril, transportista y perfil térmico (sección 2).
3. Para cada **cargo activo**, en orden:
   - Se determina la **dimensión** según la base (1 para Fijo, peso para Por tn, distancia para Por km, subtotal para %).
   - Si es Por tn y tiene escalones, se toma la **tarifa del escalón** que corresponda al peso.
   - Se calcula **Monto** = f(Valor o tarifa, dimensión) según la base (ver sección 5).
   - Si “Aplicar antes de porcentajes” y no es %, se suma al subtotal para porcentajes.
4. **Subtotal** = suma de todos los montos de los cargos.
5. **Total** = máximo( Subtotal , Cargo mínimo ).

---

## 9. Ejemplo completo

**Tarifario:**  
- Cargo mínimo: $300  
- Cargos (en orden):  
  1. Flete – Por tonelada: $80/tn (escalón 0–10 tn), $70/tn (10+ tn). Aplicar antes de %.  
  2. Distancia – Por km: $1,50/km. Aplicar antes de %.  
  3. Combustible – Porcentaje: 12%.

**Despacho:** 6 tn, carril 400 km.

- Flete: 6 tn en primer escalón → 80 × 6 = $480.  
- Distancia: 1,50 × 400 = $600.  
- Subtotal para % = 480 + 600 = $1.080.  
- Combustible: 1.080 × 12% = $129,60.  
- **Subtotal** = 480 + 600 + 129,60 = $1.209,60.  
- **Total** = max(1.209,60 ; 300) = **$1.209,60**.

Si el mismo viaje diera, por ejemplo, $250 de subtotal, el total sería **$300** (cargo mínimo).
