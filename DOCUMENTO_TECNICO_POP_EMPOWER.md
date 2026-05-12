# Documento Técnico — POP Empower
### Plataforma de Psicología Online · MVP Funcional
**Versión:** 1.0 · **Fecha:** Mayo 2026  
**Estado:** Prototipo funcional en frontend (vanilla JS) — sin backend conectado

---

## 1. Visión general del producto

POP Empower es una plataforma de psicología online que conecta pacientes con psicólogas/psiquiatras. Opera bajo tres perfiles diferenciados con accesos y funcionalidades propias:

| Perfil | Archivo | Estado |
|---|---|---|
| Paciente | `Patient Portal (14).html` | Funcional |
| Psicóloga / Psiquiatra | `Psychologist_Dashboard.html` | Funcional |
| Super Admin | `Admin_Dashboard (2).html` | Funcional |
| Empresa (B2B) | `B2B_Empresas (1).html` | Funcional (básico) |
| Onboarding nuevo paciente | `Onboarding.html` | React/JSX — pendiente migrar |

**Stack actual:** HTML + CSS + JavaScript vanilla (single-file por perfil). Sin framework, sin librerías externas, sin backend. Todo el estado vive en memoria (arrays y objetos JS en el mismo archivo).

**Diseño:** Fuente Plus Jakarta Sans · Color principal `#20dc95` (verde POP) · Sistema de componentes propio (`.card`, `.badge`, `.scard`, `.btn-green`, `.btn-gray`, `.field-input`, `.field-label`, `pbar()`, `avG()`, `tog()`).

---

## 2. Arquitectura de la aplicación (por archivo)

Todos los archivos siguen el mismo patrón de SPA (Single Page Application) en un único HTML:

```
[Data Layer]     → arrays/objetos JS con datos mock (PATIENTS, PSYCHOLOGISTS, etc.)
[State Layer]    → variables globales que controlan qué tab/modal está activo
[Render Layer]   → funciones que devuelven HTML como string (template literals)
[UI Layer]       → renderNav() + renderTab() → innerHTML del layout
[Event Layer]    → onclick handlers inline que mutan el estado y llaman rerender()
```

**Función central: `rerender()`**  
Llama a `renderNav()` + `renderTab(activeTab)`. Toda mutación de datos + estado termina con `rerender()`. Los modales se gestionan con `showModal(html)` / `closeModal()` aparte del ciclo principal.

---

## 3. Modelos de datos (Admin Dashboard)

### 3.1 PSYCHOLOGISTS

```js
{
  id: Number,
  name: String,
  initials: String,           // para avatar generado (avG())
  email: String,
  phone: String,
  ciudad: String,
  colegiado: String,          // nº colegiado oficial
  nacimiento: String,         // DD/MM/YYYY
  dni: String,
  tarifa: Number,             // €/sesión individual (coste interno)
  tarifaPareja: Number,       // €/sesión pareja (coste interno)
  haceParejas: Boolean,
  irpf: Number,               // % retención IRPF
  status: 'activo' | 'pendiente' | 'baja',
  patients: Number,           // nº pacientes asignados
  sesiones_mes: Number,       // sesiones realizadas este mes
  alta: String,               // fecha de alta en plataforma
  especialidades: String[],
  idiomas: String[],
  cuenta: String,             // IBAN para transferencia
  sesionesExternas: Number,   // sesiones fuera plataforma (este mes)
  canceladasCobro: Number,    // cancelaciones cobradas (este mes)
  bonusTrimestral: Boolean,   // si tiene bonus en trimestre actual
  liquidacion: {
    estado: 'pendiente' | 'pagada',
    mes: String
  },
  contrato: {
    firmado: Boolean,
    fecha: String | null
  },
  disponibilidad: {           // horario por día de la semana
    lun: String, mar: String, mie: String,
    jue: String, vie: String, sab: String, dom: String
  },
  vacaciones: Array           // [{desde, hasta}]
}
```

### 3.2 PATIENTS

```js
{
  id: Number,
  name: String,
  initials: String,
  email: String,
  phone: String,
  tipo: 'particular' | 'influencer',
  influencerCode: String | null,    // código promo propio del influencer
  empresa: Number | null,           // id de COMPANIES si es paciente empresa
  plan: String,                     // nombre del servicio contratado
  tipoTerapia: 'individual' | 'pareja' | 'familiar',
  precio: Number,                   // importe pagado en la última compra
  precioRenovacion: Number | null,  // precio bloqueado para próximas renovaciones
                                    // null = paga precio vigente del servicio
  usado: Number,                    // sesiones consumidas del bono actual
  total: Number,                    // sesiones totales del bono actual
  caducidad: String,                // fecha de caducidad del bono
  psico: Number,                    // id de PSYCHOLOGISTS asignada
  status: 'activo' | 'pausa' | 'baja',
  alta: String,                     // fecha de alta
  sesiones: [                       // historial de sesiones
    { fecha: String, hora: String, duracion: Number, estado: String }
  ],
  pagos: [                          // historial de compras/pagos
    {
      fecha: String,
      mes: String,                  // 'Abril 2026' — para filtros de facturación
      concepto: String,
      servicio: String,             // 'particular_individual' | 'particular_bono' | etc.
      importe: Number,
      estado: 'pagado' | 'pendiente' | 'empresa',
      metodoPago: 'tarjeta' | 'bizum' | null,
      codigoPromo: String | null
    }
  ]
}
```

### 3.3 COMPANIES (B2B)

```js
{
  id: Number,
  name: String,
  cif: String,
  contact: String,            // nombre contacto RRHH
  email: String,
  phone: String,
  plan: String,               // nombre del programa contratado
  patients: Number,           // empleados registrados
  sesiones_mes: Number,
  importe_mes: Number,
  alta: String,
  status: 'activo' | 'pendiente' | 'baja',
  psico: Number | null,       // psicóloga asignada al programa
  bonos_contratados: Number,
  bonos_usados: Number,
  sesiones_contratadas: Number, // por empleado/mes
  inicio_programa: String,
  fin_previsto: String,
  plazas_total: Number
}
```

### 3.4 SERVICES

```js
{
  id: Number,
  category: 'particular' | 'pareja' | 'psiquiatra',
  name: String,
  precio: Number,             // precio vigente (nuevos usuarios)
  precioLegacy: Number | null, // precio anterior (si hubo cambio reciente)
  descripcion: String,
  activo: Boolean
}
```

Los 6 servicios actuales:
| ID | Categoría | Nombre | Precio |
|---|---|---|---|
| 1 | particular | Sesión individual | 63€ |
| 2 | particular | Bono mensual (4 sesiones) | 232€ |
| 3 | pareja | Sesión individual pareja | 90€ |
| 4 | pareja | Bono mensual pareja (4 ses.) | 340€ |
| 5 | psiquiatra | Sesión psiquiatra | 90€ |
| 6 | psiquiatra | Bono psiquiatra (4 sesiones) | 340€ |

### 3.5 PROMO_CODES

```js
{
  id: Number,
  code: String,               // siempre mayúsculas
  type: 'general' | 'influencer' | 'referido',
  discountType: 'percent' | 'fixed_price' | 'sessions',
  value: Number,              // el % | el precio final | el nº sesiones
  uses: Number,               // usos realizados
  maxUsesPerPerson: Number | null,
  maxUsesTotal: Number | null,
  launchDate: String,
  caducidad: String,
  status: 'activo' | 'inactivo' | 'caducado',
  description: String,        // descripción interna
  appliesTo: String[],        // ['particular_individual','particular_bono',
                              //  'pareja_individual','pareja_bono']
  audiencia: 'todos' | 'nuevos'
}
```

---

## 4. Panel de Super Admin — Secciones

### 4.1 Inicio (Dashboard)

Vista general con KPIs del negocio: pacientes activos, sesiones del mes, ingresos, psicólogas activas. Incluye gráficos SVG generados dinámicamente (línea, barras, stacked, donut). Accesos rápidos a acciones frecuentes.

### 4.2 Gestión → Psicólogas

**Listado:** Tabla con 7 columnas (nombre, tarifa individual, tarifa pareja, nº pacientes, sesiones/mes, estado, acciones). Badge de estado (activo/pendiente/baja). Botón "+ Nueva psicóloga".

**Modal de psicóloga (5 tabs):**

- **Perfil:** nombre, apellidos, email, teléfono, nacimiento, DNI, ciudad, nº colegiado, idiomas (chips), especialidades (chips). Selector de estado inline en la cabecera.
- **Tarifas:** tarifa sesión individual, % IRPF, toggle pareja + tarifa pareja, IBAN, liquidación estimada del mes.
- **Disponibilidad:** horario semanal (tabla día → franja horaria), gestión de períodos de vacaciones (añadir/eliminar con fechas).
- **Contrato:** estado del contrato (firmado/pendiente), fecha de firma, acciones (reenviar firma, descargar PDF, anular).
- **Pacientes (N):** listado de pacientes asignados a esta psicóloga — badge tipo terapia, plan, progreso de sesiones, estado.

**Alta nueva psicóloga:** modal con todos los campos obligatorios y opcionales (incluye disponibilidad y tarifa pareja desde el alta).

**Funciones JS relevantes:**
- `openPsicoModal(id)` / `savePsicoModal(id, tab)`
- `openNewPsicoModal()` / `doAltaPsico()`
- `addVacacion(id)` / `doAddVacacion(id)`

### 4.3 Gestión → Pacientes

Muestra solo pacientes particulares e influencers (los de empresa se gestionan desde Empresas). Filtros por tipo (Todos / Particulares / Influencers) y por estado (Activos / Pausa / Baja). Stats en cabecera.

**Modal de paciente (3 tabs):**

- **Datos:** fecha de alta, email, teléfono, psicóloga asignada, tipo de terapia (badge), tipo de cuenta (badge particular/influencer). Para influencers: muestra sus dos códigos (código propio + código seguidores). Selector de estado.
- **Bono activo:** card resumen con barra de progreso (X/4 sesiones), ampliar sesiones (contador ±), ampliar fecha de caducidad (date picker), cambiar psicóloga asignada inline, botón dar de baja.
- **Historial:** tabla de sesiones realizadas (fecha, hora, duración, estado) + historial de pagos con botón **"↓ Factura"** por cada transacción.

**Clasificación de usuarios:**

| Tipo | Descripción | Códigos |
|---|---|---|
| Particular | Usuario estándar | Puede usar código promo al pagar |
| Influencer | Creado por admin | Tiene código propio (sesiones gratis) + código seguidores (% descuento) |
| Empresa | Gestionado desde tab Empresas | Sin código promo, pago por contrato B2B |

**Alta nuevo paciente:**
- Toggle Particular / Influencer en cabecera del modal
- **Particular:** campos base + código promo opcional
- **Influencer:** campos base + sección "Código propio" (sesiones gratuitas, máx. usos, caducidad) + sección "Código seguidores" (% descuento, máx. usos, caducidad). Al guardar crea el paciente **y** los dos PROMO_CODES automáticamente.

**Funciones JS relevantes:**
- `openPatientModal(id)` / `saveCaducidad(id)` / `ampliarBono(id)`
- `openCambiarPsicoModal(id)` / `doCambiarPsico(id)`
- `openNewPatientModal()` / `setNpTipo(tipo)` / `renderNewPatientModal()` / `doAltaPaciente()`
- `openAplicarPromoModal(id)` / `doAplicarPromo(id)`

### 4.4 Gestión → Empresas / B2B

**Listado de empresas:** nombre, CIF, plan contratado, nº empleados, sesiones/mes, estado (activo/pendiente/baja).

**Vista detalle empresa:** al hacer clic en una empresa se entra en su ficha completa con:
- Info general (CIF, contacto RRHH, plan, fechas del programa, plazas)
- Psicóloga asignada al programa
- Progreso del programa (bonos usados/contratados)
- Listado de participantes (empleados) con su estado individual: paso por el proceso onboarding (invitación enviada → registro → primera sesión → activo)

**Import CSV de participantes:** permite importar listado de empleados desde CSV (drag & drop o selección). Parsea, previsualizay confirma la carga masiva.

**Funciones JS relevantes:**
- `tabEmpresas()` / `tabEmpresaDetalle(id)`
- `openB2BParticipanteModal(id)` / `openNewB2BParticipanteModal()`
- `openB2BImportModal()` / `handleB2BCsvFile()` / `parseB2BCsv()` / `confirmB2BImport()`

### 4.5 Económico → Facturación Global

Vista con selector de mes. Dos tabs:

**Tab "Facturación pacientes":**
- KPIs: cobrado el mes, bonos activos, bonos que caducan en 30 días, pagos con código promo
- Tabla de compras del mes: paciente, servicio, importe, método de pago, código promo aplicado, estado
- Bloque "Bonos próximos a caducar" (aparece dinámicamente si hay bonos que caducan en ≤30 días), con acceso directo al bono de cada paciente
- Botón "↓ PDF" para descargar listado de cobros del mes

**Tab "Liquidación psicólogas":**
- KPIs: total a liquidar (neto), pendiente de pago, IRPF retenido, sesiones realizadas
- Tabla por psicóloga: sesiones regulares + externas (badge azul) + canceladas cobradas (badge naranja) → bruto → IRPF → neto → estado (Pendiente/Pagada) + badge "Bonus"
- Botón "Pagar" / "✓ Ok" por psicóloga (marca liquidación como pagada)
- Botón "↓ PDF" por psicóloga para descargar su factura de liquidación individual

**Descarga de documentos:** 3 tipos generados con `window.open()` + `window.print()` (sin librerías externas, exporta a PDF desde el navegador):

| Función | Descripción |
|---|---|
| `downloadAllFacturas(mes)` | Informe financiero mensual completo (KPIs + cobros pacientes + liquidación psicólogas) |
| `downloadPsicoFactura(psicoId, mes)` | Factura individual de liquidación por psicóloga (con nº de referencia, IBAN, desglose, IRPF) |
| `downloadFacturaPaciente(patId, pagoIdx)` | Recibo individual por cada pago de paciente (datos paciente, servicio, importe, método, referencia) |
| `downloadPacientesReport(mes)` | Listado de cobros de pacientes del mes en PDF |

### 4.6 Económico → Códigos Promo

**Listado:** cards por código con badge de tipo (General/Influencer/Seguidores), valor del descuento, chips de servicios a los que aplica, contador de usos (con barra de progreso si hay límite total), fechas de lanzamiento y caducidad, badge "Solo nuevos", botones Editar / Activar/Desactivar.

Stats en cabecera: activos, usos totales, influencers activos, caducados.

**Modal crear/editar código (scroll, campos completos):**

| Campo | Opciones |
|---|---|
| Nombre del código | Texto libre, fuerza mayúsculas |
| Descripción interna | Texto libre |
| Tipo | General / Influencer / Seguidores/Referido |
| Tipo de descuento | % Descuento / Precio final (€) / Sesiones gratuitas |
| Valor | Número según tipo |
| Máx. usos por persona | Número o vacío (sin límite) |
| Máx. usos en total | Número o vacío (sin límite) |
| Fecha de lanzamiento | Date picker |
| Fecha de caducidad | Date picker |
| Aplica a | Pills toggleables: Part. Sesión / Part. Bono / Pareja Sesión / Pareja Bono |
| Audiencia | Todos los usuarios / Solo nuevos usuarios |

El estado de los pills se preserva entre re-renders gracias a variables globales (`_promoType`, `_promoDiscountType`, `_promoAppliesTo`, `_promoAudiencia`, `_promoEditId`, `_promoFormVals`).

**Funciones JS relevantes:**
- `openNewPromoModal()` / `openEditPromoModal(id)` / `_renderPromoModal()`
- `setPromoType(t)` / `setPromoDiscountType(t)` / `setPromoAudiencia(a)` / `togglePromoApplies(k)`
- `doCrearPromo()` / `togglePromoStatus(id)`

### 4.7 Económico → Gestión de Precios

Dividido en tres bloques:

**Precios vigentes (nuevos usuarios):** los 6 servicios agrupados por categoría (Particulares / Pareja / Psiquiatra) con inputs editables. Botón "Guardar precios" → abre modal de confirmación.

**Modal de confirmación de cambio de precio:**
- Muestra qué servicios cambian y cuánto (ej. 63€ → 70€ +7€)
- Si hay usuarios activos sin precio fijado, ofrece dos opciones:
  - **"Fijar precio actual a usuarios sin precio propio":** los usuarios activos se quedan en el precio anterior (`precioRenovacion = precio_actual`). Nuevos usuarios pagan el nuevo precio.
  - **"Aplicar a todos":** todo el mundo paga el nuevo precio.

**Usuarios con precio de renovación propio:** tabla con los usuarios que tienen `precioRenovacion != null` — muestra su precio actual vs. el precio vigente y la diferencia. Permite:
- Editar el precio de renovación individualmente (input inline + "Guardar")
- **Subida paulatina a todos:** input con una cantidad (ej. 4) + botón "Aplicar subida" → suma esa cantidad al `precioRenovacion` de todos los usuarios con precio fijado.

**Lógica de precios por cohortes:**
```
PATIENT.precioRenovacion === null  →  paga SERVICES[x].precio (precio vigente)
PATIENT.precioRenovacion !== null  →  paga su precio personal en cada renovación
```
Esto permite mantener usuarios antiguos a un precio inferior y subirles de forma gradual e independiente del precio para nuevos usuarios.

**Tarifas psicólogas (internas):** inputs editables para tarifa individual y tarifa pareja por psicóloga. Son costes internos, el paciente no los ve.

**Funciones JS relevantes:**
- `tabPrecios()` / `confirmPriceChange()` / `applyPriceChange(mode)`
- `savePatRenov(id)` / `applyBulkIncrease()`

---

## 5. Portal del Paciente

### 5.1 Secciones (tabs)

| Tab | Contenido |
|---|---|
| Inicio | Saludo dinámico (buenos días/tardes/noches), fecha real, próxima sesión, estado del bono (barra de progreso), accesos rápidos |
| Sesiones | Calendario con fecha real marcada en verde, historial de sesiones realizadas, modales de reagendado y cambio de psicóloga |
| Mensajes | Chat con la psicóloga |
| Ejercicios | Recursos terapéuticos asignados |
| Tu plan | Info del bono activo, tipo de terapia, psicóloga asignada |
| Facturas | Historial de pagos con descarga de recibos |
| Documentos | Archivos compartidos con la psicóloga |
| Ajustes | Perfil, preferencias, eliminar cuenta (RGPD) |

### 5.2 Funcionalidades destacadas

- **Saludo dinámico:** "Buenos días/tardes/noches" calculado en tiempo real según la hora del dispositivo
- **Fecha real** en cabecera (no hardcodeada)
- **Calendario:** marca el día de hoy con el color verde `#20dc95` (no un día fijo)
- **Modal reagendar sesión** (`showRescheduleModal()`): selección de franja horaria, confirmación con toast
- **Modal cambio de psicóloga** (`showPsychChangeModal()`): solicitud con motivo
- **`showToast()`** para feedback de confirmación en todas las acciones
- **Tab Progreso:** historial visual de sesiones + card "Próxima sesión"

---

## 6. Dashboard de la Psicóloga

### 6.1 Secciones (tabs)

| Tab | Contenido |
|---|---|
| Inicio | Resumen del día: próximas sesiones, pacientes activos, KPIs del mes, accesos rápidos, gestión de sesiones (botón ⋮ por fila) |
| Agenda | Vista día/semana/mes con navegación dinámica (`agendaOffset`), botón "↗ Sesión externa" |
| Pacientes | Listado de pacientes asignados con historial |
| Mensajes | Conversaciones con pacientes |
| Notas clínicas | Notas por paciente por sesión |
| Facturación | Facturas mensuales propias con desglose |
| Estadísticas | Métricas de actividad |
| Ajustes | Perfil, URL sala Whereby, configuración |
| Ayuda | FAQs en acordeón (6 categorías, basadas en Manual Metodología POP) |

### 6.2 Funcionalidades destacadas

**Gestión de sesiones (botón ⋮):** cada sesión en el Inicio tiene un menú de opciones:
- Marcar como realizada
- Cancelar con cobro → añade a `CANCELLED_BILLABLE[]`, aparece en facturación con badge naranja
- Reprogramar
- Eliminar

**Sesiones externas:** botón "↗ Sesión externa" en la Agenda → modal con (paciente, fecha, hora, duración, motivo, nota) → se guarda en `EXTERNAL_SESSIONS[]` y se incluye automáticamente en `calcFactura()` con badge azul "Fuera plataforma".

**Videollamada Whereby:** iframe integrado en la sala de sesión. URL configurable desde Ajustes (`psychProfile.wherebyRoom`).

**Tour guiado:** 8 pasos, resalta el nav activo, tooltip flotante con progreso (para onboarding de nuevas psicólogas).

**Facturación propia (`calcFactura()`):**
- Estructura `BILLING_MONTHS`: sesiones por paciente, número de factura, fecha, estado (pendiente_pago/pagada/fechaPago)
- Incluye sesiones regulares + externas + canceladas con cobro
- IRPF aplicado automáticamente según `billingConfig.irpf`

**Bonus trimestral dinámico:**
- `getWeeksInMonth(year, month)` cuenta los lunes del mes para determinar el umbral (4 o 5 sesiones)
- `BONUS_Q1_2026` y `BONUS_Q2_2026` con umbrales `[4,4,5]` por mes
- Calcula si cada paciente alcanzó el umbral y si la psicóloga cobra bonus ese trimestre

---

## 7. Portal Empresa (B2B)

Vista simplificada para el responsable de RRHH de una empresa cliente. Muestra:
- Estado del programa contratado (plazas, bonos usados, sesiones/mes)
- Listado de empleados y su estado en el programa
- Métricas de uso y bienestar

---

## 8. Onboarding (registro nuevo paciente)

Archivo `Onboarding.html` — actualmente en React/JSX (se carga con Babel en el navegador). **Pendiente migrar a vanilla JS** para unificarlo con el resto de la plataforma.

---

## 9. Pendientes de conectar con backend

Esta es la lista de lo que el frontend tiene modelado pero que necesita endpoints reales:

### 9.1 Autenticación
- No existe ninguna pantalla de login. Todos los archivos arrancan directamente en la vista principal.
- Se necesita: login/logout, gestión de sesión (JWT o cookies), roles (admin / psicóloga / paciente / empresa).

### 9.2 Sincronización de datos entre perfiles
Los tres dashboards tienen sus propios datos mock independientes. En producción, todos consumen la misma fuente (API):

| Dato | Dónde se edita | Dónde se consume |
|---|---|---|
| Tarifa psicóloga | Admin (`PSYCHOLOGISTS.tarifa`) | Dashboard psicóloga (`billingConfig.tarifaSesion`) |
| Sesiones externas | Dashboard psicóloga (`EXTERNAL_SESSIONS[]`) | Admin (Facturación → liquidación) |
| Canceladas con cobro | Dashboard psicóloga (`CANCELLED_BILLABLE[]`) | Admin (Facturación → liquidación) |
| Bonus trimestral | Dashboard psicóloga (`BONUS_Q1/Q2`) | Admin (badge en liquidación) |
| Estado de liquidación | Admin (botón "Pagar") | Dashboard psicóloga (estado de factura) |
| Precio de renovación | Admin (`PATIENTS.precioRenovacion`) | Portal paciente (lo que paga al renovar) |
| Próxima sesión | Dashboard psicóloga (agenda) | Portal paciente (tab Inicio) |

### 9.3 Pasarela de pago
- Portal paciente necesita integración con pasarela (Stripe recomendado)
- Campo `metodoPago` en `PATIENTS.pagos[]` ya existe y está tipado
- Cupones/códigos promo (`PROMO_CODES`) necesitan validación server-side

### 9.4 Generación de PDFs
- Actualmente los PDFs se generan abriendo una ventana de impresión del navegador (`window.print()`)
- En producción: generación server-side (ej. Puppeteer, wkhtmltopdf) para almacenar facturas como archivos permanentes
- Ya existe la estructura de numeración: `POP-EG-2026/04` para psicólogas, `POP-PAC-001-1` para pacientes

### 9.5 Videollamadas
- Integración con **Whereby** (iframe) implementada en el dashboard de psicóloga
- URL de sala configurable desde Ajustes
- En producción: crear sala dinámica por sesión via Whereby API

### 9.6 Emails / notificaciones
- No implementados en el frontend (se asumen como responsabilidad del backend)
- Puntos de disparo identificados: alta nueva psicóloga/paciente, cambio de sesión, caducidad de bono próxima, liquidación emitida

### 9.7 Firma electrónica de contratos
- Frontend tiene el estado `contrato: { firmado: Boolean, fecha: String }` en psicólogas
- Botones "Reenviar contrato" y "Descargar" están en la UI
- Necesita integración con servicio de firma (ej. Signaturit, DocuSign)

---

## 10. Patrones de código reutilizables

### Componentes helper (Admin)

```js
avG(initials, size)          // avatar circular con iniciales
pbar(percent, height)        // barra de progreso verde
tog(value, onChangeCode)     // toggle switch
psyName(id)                  // nombre de psicóloga por id
compName(id)                 // nombre de empresa por id
```

### Patrón de modal con tabs y estado preservado

Cada modal con tabs usa:
1. Variable global de estado: `let xModalTab = 'tab1'`
2. Función que genera el HTML: `openXModal(id)` → llama a `showModal(html)`
3. Tabs que mutan el estado y re-llaman: `onclick="xModalTab='tab2'; openXModal(id)"`
4. `saveXModal(id, tab)` guarda solo los campos del tab activo

### Patrón de pills con re-render preservando campos

Para selectors con re-render (ej. modal de códigos promo):
1. Variables globales para el estado de los pills: `_promoType`, `_promoDiscountType`, etc.
2. `_savePromoVals()` guarda los valores actuales de los inputs antes de re-renderizar
3. `v(id, fallback)` recupera `_promoFormVals[id]` o el fallback al renderizar

### Generación de PDF

```js
_pdfStyles()                              // CSS para la ventana de impresión
_pdfHeader(titulo, fecha, extra)          // cabecera con logo POP Empower
_openPrint(html)                          // abre ventana y dispara window.print()
```

---

## 11. Convenciones de nomenclatura

| Tipo | Convención | Ejemplo |
|---|---|---|
| Datos globales | MAYUSCULAS | `PATIENTS`, `SERVICES` |
| Estado de UI | camelCase con prefijo | `patModalTab`, `facFactTab` |
| Estado temporal de modales | `_` + camelCase | `_promoType`, `_npTipo` |
| Funciones de tab | `tab` + NombreTab | `tabPacientes()`, `tabFacturacion()` |
| Funciones de modal | `open/save/do` + Nombre | `openPatientModal()`, `doCrearPromo()` |
| IDs de inputs en modales | prefijo corto + `-` + campo | `np-nombre`, `pm-code`, `pat-renov-{id}` |

---

## 12. Resumen de archivos y tamaño aproximado

| Archivo | Funciones JS | Descripción |
|---|---|---|
| `Admin_Dashboard (2).html` | ~90 | Panel super admin completo |
| `Psychologist_Dashboard.html` | ~92 | Dashboard psicóloga completo |
| `Patient Portal (14).html` | ~90 | Portal paciente completo |
| `B2B_Empresas (1).html` | ~27 | Portal empresa (básico) |
| `Onboarding.html` | — | React/JSX — pendiente migrar |

---

*Documento generado a partir del código fuente del MVP funcional. Para cualquier duda sobre implementación o lógica de negocio, contactar con el equipo de producto POP Empower.*
