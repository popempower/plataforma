# POP Empower — Documento de Producto y Desarrollo
### Product Requirements Document · Versión completa
**Fecha:** Mayo 2026 · **Estado del MVP:** Frontend funcional, sin backend

---

## Índice

1. [Visión del producto](#1-visión-del-producto)
2. [Perfiles de usuario](#2-perfiles-de-usuario)
3. [Portal del Paciente](#3-portal-del-paciente)
4. [Dashboard de la Psicóloga](#4-dashboard-de-la-psicóloga)
5. [Panel Super Admin](#5-panel-super-admin)
6. [Portal Empresa B2B](#6-portal-empresa-b2b)
7. [Sistema de precios y cohortes](#7-sistema-de-precios-y-cohortes)
8. [Sistema de códigos promocionales](#8-sistema-de-códigos-promocionales)
9. [Sistema de facturación y descarga de documentos](#9-sistema-de-facturación-y-descarga-de-documentos)
10. [Flujos de alta y onboarding](#10-flujos-de-alta-y-onboarding)
11. [Pendientes y próximos pasos](#11-pendientes-y-próximos-pasos)

---

## 1. Visión del producto

POP Empower es una plataforma de psicología online que conecta pacientes con psicólogas y psiquiatras. El modelo de negocio se basa en sesiones individuales o bonos mensuales de 4 sesiones, con dos modalidades de terapia (individual y pareja) y una línea de psiquiatría.

La plataforma tiene tres actores principales:

- **Pacientes particulares** — contratan y gestionan su terapia de forma autónoma
- **Psicólogas / psiquiatras** — profesionales que imparten las sesiones y gestionan su agenda y facturación
- **Super admin (POP Empower)** — gestiona todo: profesionales, pacientes, precios, facturación, empresas y códigos promocionales

Existe además un cuarto actor secundario:

- **Empresas (B2B)** — contratan programas de bienestar para sus empleados

### Modelo de ingresos

| Canal | Mecanismo |
|---|---|
| Particular — sesión suelta | Paciente paga 63€ (individual) o 90€ (pareja/psiquiatra) por sesión |
| Particular — bono mensual | Paciente paga 232€ (individual) o 340€ (pareja/psiquiatra) por 4 sesiones |
| Empresa B2B | Contrato mensual por número de plazas y sesiones contratadas |
| Influencer / Referidos | Descuentos gestionados con códigos promo; el influencer tiene sus propias condiciones |

### Catálogo de servicios

| Servicio | Precio vigente |
|---|---|
| Sesión individual (particular) | 63 € |
| Bono mensual 4 sesiones (particular) | 232 € |
| Sesión individual pareja | 90 € |
| Bono mensual 4 sesiones pareja | 340 € |
| Sesión psiquiatra | 90 € |
| Bono psiquiatra 4 sesiones | 340 € |

---

## 2. Perfiles de usuario

### 2.1 Paciente particular

Usuario final de la plataforma. Puede ser:

- **Particular estándar** — se registra solo o con código promo
- **Influencer** — el admin le crea la cuenta manualmente; tiene dos códigos asociados (ver sección 8)
- **Empleado de empresa** — accede a través del programa B2B de su empresa; no paga de su bolsillo

El paciente gestiona su bono, sus sesiones, su psicóloga y sus facturas desde el portal.

### 2.2 Psicóloga / Psiquiatra

Profesional contratada por POP Empower. La plataforma le paga una tarifa por sesión (no el precio que paga el paciente). Cada psicóloga puede tener tarifa diferente (actualmente 25€, 30€, 35€/sesión). Si hace terapia de pareja tiene una tarifa pareja adicional.

El admin gestiona toda su información: perfil, disponibilidad, contrato, tarifa, IRPF. La psicóloga tiene su propio dashboard donde gestiona su agenda, pacientes, notas y facturación.

### 2.3 Super Admin

Gestiona toda la plataforma. Tiene acceso completo a:
- Alta y gestión de psicólogas
- Alta y gestión de pacientes (particulares e influencers)
- Gestión de empresas B2B y sus programas
- Control de precios y cohortes de precios
- Códigos promocionales (creación, edición, activación/desactivación)
- Facturación global (cobros de pacientes + liquidación de psicólogas)
- Estadísticas generales
- Base de datos y ajustes del sistema

### 2.4 Empresa B2B

El responsable de RRHH de una empresa cliente. Ve el estado de su programa, los empleados registrados y las métricas de uso. No gestiona precios ni psicólogas; solo supervisa.

---

## 3. Portal del Paciente

**Archivo:** `Patient Portal (14).html`

### 3.1 Secciones del portal

#### Inicio
- Saludo dinámico según hora real del dispositivo: "Buenos días", "Buenas tardes" o "Buenas noches"
- Fecha del día en la cabecera (calculada en tiempo real, no hardcodeada)
- Card de próxima sesión con fecha, hora y nombre de la psicóloga
- Estado del bono activo: barra de progreso mostrando sesiones usadas vs. total (ej. 2/4)
- Accesos rápidos a las secciones principales

#### Sesiones
- Calendario mensual donde el día de hoy se marca en verde (`#20dc95`), no un día fijo
- Historial de sesiones realizadas
- **Modal de reagendar sesión** (`showRescheduleModal()`): el paciente selecciona una franja horaria alternativa y confirma
- **Modal de solicitud de cambio de psicóloga** (`showPsychChangeModal()`): el paciente indica el motivo y lo envía al equipo

Ambos modales reemplazan los antiguos enlaces de WhatsApp que había en versiones anteriores.

#### Mensajes
- Chat con la psicóloga asignada

#### Ejercicios
- Recursos terapéuticos asignados por la psicóloga

#### Tu plan
- Información del bono activo: tipo de servicio, tipo de terapia, psicóloga asignada
- Fecha de caducidad del bono

#### Facturas
- Historial de pagos realizados con posibilidad de descarga de recibo por cada transacción

#### Documentos
- Archivos compartidos entre paciente y psicóloga

#### Ajustes
- Edición de perfil
- Preferencias de comunicación
- **Eliminar cuenta (RGPD)**: botón de baja con confirmación, cumple normativa de protección de datos

### 3.2 Feedback de acciones

Todas las acciones de confirmación (reagendar, solicitar cambio, guardar preferencias) usan `showToast()` — una notificación flotante temporal en la parte inferior de la pantalla, sin necesidad de recargar la página.

---

## 4. Dashboard de la Psicóloga

**Archivo:** `Psychologist_Dashboard.html`

### 4.1 Secciones del dashboard

#### Inicio
- Saludo dinámico + fecha real en la barra superior
- Resumen del día: próximas sesiones con hora y paciente
- KPIs del mes: sesiones realizadas, ingresos estimados, pacientes activos
- Listado de sesiones del día con **menú de acciones por sesión (botón ⋮)**:
  - Marcar como realizada
  - Cancelar con cobro → la sesión se añade a `CANCELLED_BILLABLE[]` y aparece en su facturación con badge naranja "Cancelada cobro"
  - Reprogramar
  - Eliminar

#### Agenda
- Tres vistas: día / semana / mes
- Navegación dinámica con `agendaOffset` (avanzar/retroceder en el tiempo)
- **Botón "↗ Sesión externa"**: permite registrar sesiones realizadas fuera de la plataforma (presenciales u otras). Campos: paciente, fecha, hora, duración, motivo, nota. Se guardan en `EXTERNAL_SESSIONS[]` y se incluyen automáticamente en la facturación mensual con badge azul "Fuera plataforma"

#### Pacientes
- Listado de pacientes asignados a esta psicóloga
- Historial de sesiones por paciente
- Notas y estado de cada paciente

#### Mensajes
- Conversaciones con los pacientes

#### Notas clínicas
- Notas por paciente por sesión (almacenadas en `CLINICAL_NOTES`)
- Visibles solo por la psicóloga, no por el paciente

#### Facturación
La psicóloga ve sus propias facturas mensuales. El sistema calcula automáticamente:

- **Sesiones regulares:** todas las marcadas como realizadas en la agenda
- **Sesiones externas:** las registradas con "↗ Sesión externa"
- **Canceladas con cobro:** las que el paciente canceló pero la psicóloga cobra igualmente
- **Total bruto:** suma de todo × tarifa/sesión
- **Retención IRPF:** porcentaje configurado por el admin (actualmente 7%)
- **Neto a cobrar:** bruto − IRPF

Estructura de datos `BILLING_MONTHS`:
```
'Abril 2026': {
  sessions: [{patient: 'Nombre', sesiones: N}, ...],
  facturaNum: 'POP-EG-2026/04',
  fecha: '30-04-2026',
  estado: 'pendiente_pago' | 'pagada',
  fechaPago: '05-05-2026'  // si está pagada
}
```

**Bonus trimestral dinámico:** el sistema calcula si la psicóloga ha alcanzado el umbral de sesiones por paciente en cada mes del trimestre. El umbral varía según el número de lunes en el mes (`getWeeksInMonth()`): 4 sesiones en meses con 4 lunes, 5 sesiones en meses con 5 lunes. Si se cumple el umbral, la psicóloga recibe un bonus.

#### Ajustes
- Edición de perfil completo (foto, datos personales, especialidades, idiomas)
- **URL de sala Whereby:** campo configurable (`psychProfile.wherebyRoom`). El iframe de videollamada carga esta URL en la sala de sesión
- Configuración de notificaciones
- **Eliminar cuenta (RGPD)**

#### Ayuda
- FAQs en acordeón organizadas en 6 categorías basadas en el Manual de Metodología POP:
  - Sesiones y agenda
  - Pacientes
  - Facturación
  - Plataforma técnica
  - Videollamadas
  - Protocolo clínico

### 4.2 Tour guiado para nuevas psicólogas
- 8 pasos que guían a la psicóloga por las secciones principales del dashboard
- Resalta el ítem de navegación activo
- Tooltip flotante con indicador de progreso (paso X de 8)
- Útil para onboarding de nuevas profesionales sin necesidad de soporte humano

### 4.3 Videollamadas (Whereby)
- Integración via iframe: cuando empieza una sesión, se carga la sala de Whereby directamente en el dashboard
- La URL de la sala la configura cada psicóloga desde sus Ajustes
- En producción se reemplazará por creación dinámica de sala via API de Whereby para cada sesión

---

## 5. Panel Super Admin

**Archivo:** `Admin_Dashboard (2).html`

El panel del admin tiene la navegación organizada en cuatro grupos:

| Grupo | Secciones |
|---|---|
| Principal | Inicio (dashboard) |
| Gestión | Psicólogas · Pacientes · Empresas/B2B |
| Económico | Facturación global · Códigos promo · Gestión de precios |
| Análisis | Estadísticas |
| Sistema | Base de datos · Ajustes |

### 5.1 Inicio

Dashboard con visión general: pacientes activos, sesiones del mes, ingresos, psicólogas activas. Gráficos SVG generados dinámicamente (línea de tendencia, barras comparativas, stacked de tipos de terapia, donut de distribución).

### 5.2 Gestión → Psicólogas

#### Listado
Tabla con columnas: nombre, tarifa individual, tarifa pareja, nº pacientes asignados, sesiones este mes, estado (activo/pendiente/baja), acciones. Badge de estado coloreado. Si hay psicólogas en estado "pendiente", aparece un badge numérico en el ítem de la barra lateral.

#### Modal de psicóloga — 5 tabs

**Tab Perfil:**
Nombre, apellidos, email, teléfono, fecha de nacimiento, DNI, ciudad, nº de colegiado, idiomas (mostrados como chips/badges), especialidades (chips). Selector de estado inline en la cabecera del modal (activo / pendiente / baja).

**Tab Tarifas:**
- Tarifa por sesión individual (€) — es lo que cobra la psicóloga, no lo que paga el paciente
- % de retención IRPF
- Toggle "¿Hace terapia de pareja?" — al activarse muestra el campo de tarifa pareja
- IBAN para transferencias
- Cálculo dinámico de liquidación estimada del mes (sesiones_mes × tarifa − IRPF)

**Tab Disponibilidad:**
- Tabla de horario semanal: para cada día (L–D) un campo con la franja horaria (ej. "10:00–19:00") o "—" si no trabaja
- Gestión de períodos de vacaciones: botón "Añadir período" → modal con fecha inicio y fecha fin → se añade a la lista; botón de eliminar por período

**Tab Contrato:**
- Estado del contrato: firmado / pendiente de firma
- Fecha de firma (si firmado)
- Acciones disponibles: reenviar contrato para firma, descargar PDF del contrato, anular contrato
- (En producción: integración con servicio de firma electrónica tipo Signaturit o DocuSign)

**Tab Pacientes (N):**
Listado de los pacientes asignados a esta psicóloga. Muestra badge de tipo de terapia (individual/pareja/familiar), plan contratado, progreso de sesiones en el bono actual, estado del paciente. El número en la pestaña se actualiza dinámicamente.

#### Alta de nueva psicóloga
Modal con todos los campos del perfil + tarifas + disponibilidad inicial. Al guardar se crea el objeto completo con contrato en estado "pendiente" y vacaciones vacías.

### 5.3 Gestión → Pacientes

#### Criterio de inclusión
Este tab muestra **únicamente** pacientes particulares e influencers. Los pacientes de empresa no aparecen aquí — se gestionan desde la sección Empresas/B2B. El filtro es `PATIENTS.filter(p => !p.empresa)`.

#### Filtros
Dos filas de pills:
- **Tipo:** Todos / Particulares / Influencers
- **Estado:** Todos / Activos / Pausa / Baja

Estadísticas en cabecera: total particulares, activos, influencers, bajas.

#### Listado
Tabla con: nombre (badge morado "Influencer" si aplica), psicóloga asignada, tipo de terapia, plan, progreso del bono (barra), estado, acciones. Badge de estado coloreado.

#### Modal de paciente — 3 tabs

**Tab Datos:**
- Fecha de alta en la plataforma
- Email y teléfono
- Psicóloga asignada (nombre)
- Badge de tipo de terapia (individual / pareja / familiar)
- Badge de tipo de cuenta (particular / influencer)
- **Para influencers:** muestra sus dos códigos:
  - Código propio (ej. `CARLOS_INF`): sus sesiones gratuitas personales
  - Código seguidores (ej. `CARLOS_FANS`): el que comparte con su audiencia
- Selector de estado: activo / pausa / baja

**Tab Bono activo:**
- Card resumen: nombre del plan, sesiones usadas / total, fecha de caducidad
- Barra de progreso visual
- **Ampliar sesiones:** contador ± para añadir sesiones al bono
- **Ampliar fecha de caducidad:** date picker para extender la fecha de vencimiento; botón "Guardar caducidad" que actualiza `p.caducidad` y muestra toast de confirmación
- **Cambiar psicóloga:** selector inline con las psicólogas activas → confirmar → reasigna `p.psico` y actualiza contadores
- **Dar de baja:** botón rojo con confirmación

**Tab Historial:**
- Tabla de sesiones realizadas: fecha, hora, duración, estado (realizada / cancelada / pendiente)
- Historial de compras/pagos: cada pago muestra concepto, fecha, método de pago y un botón **"↓ Factura"** que descarga el recibo individual de ese pago

#### Alta de nuevo paciente

El modal tiene un **selector de tipo** (Particular / Influencer) en la cabecera que cambia lo que se muestra:

**Alta Particular:**
- Nombre, apellidos, email, teléfono
- Psicóloga a asignar (dropdown con activas)
- Plan (dropdown con servicios activos)
- Tipo de terapia (individual / pareja / familiar)
- Código promocional opcional

**Alta Influencer:**
Los mismos campos base, más dos secciones adicionales para crear los códigos:

*Sección 1 — Código propio (sesiones gratuitas):*
- Nombre del código (ej. `MARIA_INF`)
- Número de sesiones gratuitas
- Máximo de usos (vacío = sin límite)
- Fecha de caducidad

*Sección 2 — Código seguidores (descuento):*
- Nombre del código (ej. `MARIA_FANS`)
- % de descuento
- Máximo de usos (vacío = sin límite)
- Fecha de caducidad

Al pulsar "Crear paciente + 2 códigos" se crean simultáneamente:
1. El paciente en `PATIENTS[]` con `tipo: 'influencer'`
2. Un código en `PROMO_CODES[]` de tipo `influencer` para el código propio
3. Un código en `PROMO_CODES[]` de tipo `referido` para los seguidores

**Por qué dos códigos separados:** Las condiciones del influencer para sus propias sesiones (normalmente sesiones gratuitas, sin límite de usos) son completamente diferentes a las condiciones que ofrece a sus seguidores (normalmente un porcentaje de descuento, con límite de usos). Deben ser independientes.

### 5.4 Gestión → Empresas / B2B

#### Listado de empresas
Tabla con: nombre empresa, CIF, plan contratado, nº empleados registrados, sesiones/mes, estado (activo/pendiente/baja), acciones. Al hacer clic en una empresa se entra en su ficha detallada.

#### Ficha de empresa (detalle)
Pantalla completa con:
- Datos generales: CIF, contacto RRHH, email, teléfono
- Plan contratado, fechas de inicio y fin previsto del programa
- Plazas totales contratadas
- Psicóloga asignada al programa
- **Progreso del programa:** bonos usados / bonos contratados (barra visual)
- **Listado de participantes (empleados):** con su estado individual en el proceso

**Estados de participante (proceso onboarding B2B):**
1. Invitación enviada
2. Registro completado
3. Primera sesión realizada
4. Activo (en programa)

Cada participante tiene badge con su estado actual. Esto permite al admin ver de un vistazo quién está activo, quién no ha completado el registro y quién lleva el programa al día.

#### Importación masiva de participantes (CSV)
Para dar de alta empleados de forma masiva:
1. Botón "↑ Importar participantes"
2. Modal con zona de drag & drop o selector de archivo
3. El sistema parsea el CSV, muestra una previsualización de los registros detectados
4. Confirmación → los participantes se añaden al programa

### 5.5 Económico → Facturación Global

Sección dividida en dos bloques seleccionables mediante tabs. Selector de mes en la cabecera (Abril 2026 / Marzo 2026 / etc.) que filtra todo el contenido. Botón "↓ Descargar todo" para exportar el informe completo del mes.

**KPIs globales (siempre visibles):**
- Ingresos pacientes del mes
- Ingresos empresas del mes
- Coste psicólogas (neto a liquidar)
- Margen estimado (ingresos − costes)

#### Tab "Facturación pacientes"

**KPIs del bloque:**
- Cobrado el mes
- Bonos activos
- Bonos que caducan en los próximos 30 días (con alerta visual si hay alguno)
- Pagos en los que se usó un código promo

**Tabla de compras del mes:**
Cada fila muestra: paciente, servicio contratado, tipo de terapia, importe, método de pago (tarjeta/bizum), código promo utilizado (si lo hubo), estado del pago. Botón "↓ PDF" para exportar este listado.

**Bonos próximos a caducar:**
Sección dinámica que solo aparece cuando hay bonos con fecha de caducidad en los próximos 30 días. Muestra: paciente, psicóloga, sesiones usadas/total, fecha de caducidad, botón directo al modal de gestión del bono de ese paciente. Permite actuar antes de que el paciente pierda sesiones sin usar.

#### Tab "Liquidación psicólogas"

**KPIs del bloque:**
- Total a liquidar (suma de netos)
- Pendiente de pago (psicólogas aún no marcadas como pagadas)
- IRPF retenido total
- Total de sesiones realizadas

**Tabla de liquidación:**
Por cada psicóloga activa se muestra:
- Sesiones regulares del mes
- Sesiones externas (badge azul) — registradas fuera de la plataforma
- Canceladas con cobro (badge naranja) — paciente canceló pero se cobra
- Bruto total (suma de todas × tarifa)
- IRPF retenido
- **Neto a transferir** (campo destacado)
- Estado: Pendiente / Pagada + badge "Bonus" si tiene bonus trimestral
- Botón "Pagar" → marca la liquidación como pagada, cambia a "✓ Ok"
- Botón "↓ PDF" → descarga la factura individual de liquidación de esa psicóloga para ese mes

**Fila de totales** al pie de la tabla con sumas de todos los campos.

**Nota de pendientes:** al pie del bloque de psicólogas hay una nota informativa que indica qué datos están pendientes de conectar con el backend (sesiones externas y canceladas con cobro, bonus trimestrales, generación de PDF server-side).

### 5.6 Económico → Códigos Promo

Ver sección 8 de este documento para la descripción completa del sistema de códigos.

### 5.7 Económico → Gestión de Precios

Ver sección 7 de este documento para la descripción completa del sistema de precios.

### 5.8 Estadísticas

Métricas de actividad de la plataforma con gráficos SVG (línea, barras, stacked, donut). Datos de sesiones, ingresos, altas y retención.

### 5.9 Base de datos

Vista de administración del contenido de los arrays principales (PATIENTS, PSYCHOLOGISTS, COMPANIES). Permite búsqueda y visualización directa de los datos.

### 5.10 Ajustes del sistema

Configuración general de la plataforma.

---

## 6. Portal Empresa B2B

**Archivo:** `B2B_Empresas (1).html`

Vista del responsable de RRHH de una empresa cliente. Acceso limitado: solo ve los datos de su propia empresa y sus empleados.

Contenido:
- Estado del programa contratado (plazas, bonos usados, sesiones contratadas por empleado)
- Listado de empleados con su estado en el programa
- Métricas de uso y bienestar del equipo
- Contacto con el equipo de POP Empower

---

## 7. Sistema de precios y cohortes

### 7.1 El problema que resuelve

Cuando POP Empower quiere subir precios, los usuarios que ya llevan tiempo en la plataforma no deberían verse impactados de golpe. Lo razonable es que los nuevos usuarios paguen el precio nuevo y los actuales mantengan un precio bloqueado que se puede ir ajustando de forma gradual.

### 7.2 Cómo funciona

Cada paciente tiene un campo `precioRenovacion`:
- `null` → paga el precio vigente del servicio al renovar
- Un número → paga ese precio específico al renovar, independientemente de lo que cambie el precio del servicio

Esto crea dos "capas":

| Capa | Quién | Qué precio paga |
|---|---|---|
| Precio vigente | Nuevos usuarios + usuarios sin precio bloqueado | `SERVICES[x].precio` |
| Precio personal | Usuarios con `precioRenovacion` establecido | `patient.precioRenovacion` |

### 7.3 Flujo de cambio de precios

1. El admin edita los precios en la sección "Gestión de precios" (inputs por servicio)
2. Pulsa "Guardar precios"
3. Aparece un modal de confirmación que muestra exactamente qué cambia (ej. "63€ → 70€ (+7€)")
4. El admin elige entre dos opciones:
   - **"Fijar precio actual a usuarios sin precio propio":** todos los usuarios activos que no tenían `precioRenovacion` reciben su precio actual como precio bloqueado. El nuevo precio solo aplica a nuevos usuarios y futuros registros.
   - **"Aplicar a todos":** todo el mundo paga el nuevo precio, se borran todos los `precioRenovacion`.

### 7.4 Subida paulatina de precios para usuarios existentes

En la sección "Gestión de precios" hay un bloque secundario: **"Usuarios con precio de renovación propio"**. Aparece solo cuando hay pacientes con `precioRenovacion` establecido.

Muestra una tabla con:
- Nombre del paciente
- Su precio de renovación actual (editable inline)
- El precio vigente para nuevos usuarios
- La diferencia (ej. "−12€ menos")
- Botón "Guardar" por fila para actualizar individualmente

Y una barra de **subida paulatina a todos**: un campo numérico (ej. "4") y el botón "Aplicar subida". Al pulsarlo, suma esa cantidad al `precioRenovacion` de todos los usuarios con precio bloqueado.

**Ejemplo de uso real:**

Precio actual para nuevos: 63€/bono. Ana lleva 1 año y paga 220€ (precio antiguo).
- Hoy el admin aplica una subida de +4€ → Ana pasa a pagar 224€
- En 3 meses, otra subida de +4€ → Ana paga 228€
- En 6 meses, otra subida → 232€ (precio vigente)

Así Ana llega al precio de mercado de forma gradual, sin notar un salto brusco.

### 7.5 Sección de tarifas de psicólogas (interna)

Dentro de la misma pantalla de "Gestión de precios" hay un bloque separado para las tarifas de las psicólogas (lo que POP Empower les paga, no lo que pagan los pacientes). Inputs editables por psicóloga para tarifa individual y tarifa pareja. No tienen flujo de confirmación porque son costes internos que no afectan a los pacientes.

---

## 8. Sistema de códigos promocionales

### 8.1 Tipos de código

| Tipo | Para qué se usa |
|---|---|
| General | Campañas de marketing, descuentos de bienvenida, temporadas |
| Influencer | Código personal del influencer para sus propias sesiones gratuitas |
| Seguidores / Referido | Código que el influencer comparte con su audiencia |

### 8.2 Tipos de descuento

| Tipo de descuento | Cómo funciona |
|---|---|
| % Descuento | Se resta un porcentaje del precio del servicio |
| Precio final (€) | El usuario paga directamente ese precio fijo, independientemente del precio del servicio |
| Sesiones gratuitas | El usuario recibe N sesiones sin coste |

### 8.3 Configuración completa de un código

Cada código tiene:
- **Nombre:** en mayúsculas (ej. `VERANO25`, `MARIA_INF`)
- **Descripción interna:** solo visible para el admin
- **Tipo:** general / influencer / seguidores
- **Tipo de descuento:** % / precio final / sesiones gratuitas
- **Valor:** el número que corresponde al tipo (20 para 20%, 45 para precio de 45€, 3 para 3 sesiones)
- **Máx. usos por persona:** cuántas veces puede usar el código la misma persona. Vacío = sin límite
- **Máx. usos en total:** cuántas veces puede usarse el código entre todos los usuarios. Vacío = sin límite
- **Fecha de lanzamiento:** el código no es válido antes de esta fecha
- **Fecha de caducidad:** el código expira en esta fecha
- **Aplica a:** los servicios en los que es válido. Pills seleccionables: Particular·Sesión / Particular·Bono / Pareja·Sesión / Pareja·Bono
- **Audiencia:** "Todos los usuarios" o "Solo nuevos usuarios"

### 8.4 El sistema de doble código para influencers

Cuando una persona influencer se une a la plataforma como paciente, se generan automáticamente dos códigos con condiciones independientes:

**Código propio (ej. `MARIA_INF`):**
- Para las sesiones de la propia influencer
- Tipo: "influencer"
- Descuento: sesiones gratuitas (ej. 3 sesiones)
- Máx. usos por persona: normalmente 1 (solo ella lo usa)
- Sin límite total (o límite 1)

**Código seguidores (ej. `MARIA_FANS`):**
- Para los seguidores de la influencer que lleguen a la plataforma a través de ella
- Tipo: "referido"
- Descuento: % de descuento (ej. 15%)
- Máx. usos por persona: 1 (cada seguidor solo lo usa una vez)
- Sin límite total (que lo usen todos los que quieran)
- Aplica a: todos los servicios

Ambos códigos nacen en el mismo momento que el paciente influencer, pero son completamente independientes en condiciones y contadores.

### 8.5 Flujo de creación y edición

El modal de creación/edición usa pills interactivas para los selectors. Al hacer clic en un pill (tipo, tipo de descuento, aplica a, audiencia), el modal se re-renderiza mostrando el estado actualizado. Los valores de los campos de texto se preservan entre re-renders mediante `_promoFormVals[]`.

Al editar un código existente, el modal se pre-rellena con todos sus valores actuales.

Validaciones:
- Nombre del código obligatorio
- Descripción obligatoria
- Al menos un servicio seleccionado en "Aplica a"
- Si el nombre ya existe al crear uno nuevo, muestra aviso

---

## 9. Sistema de facturación y descarga de documentos

### 9.1 Documentos generables

Todos los documentos se generan en el navegador con una ventana de impresión (`window.open()` + `window.print()`), sin librerías externas. El usuario puede guardar como PDF desde el diálogo de impresión del sistema operativo.

Cada documento tiene:
- Cabecera con logo "POP Empower", título del documento, fecha y referencia
- Cuerpo con el contenido específico (ver abajo)
- Pie con "POP Empower · documento interno" y el número de referencia

#### Informe financiero mensual completo (`downloadAllFacturas(mes)`)
Descargable desde el botón "↓ Descargar todo" en la cabecera de Facturación:
- KPIs del mes (ingresos pacientes, empresas, coste psicólogas, margen)
- Tabla completa de cobros de pacientes (paciente, servicio, código promo, importe, método, estado)
- Tabla de liquidación de todas las psicólogas (sesiones, externas, canceladas, bruto, IRPF, neto, estado)

#### Factura de liquidación individual por psicóloga (`downloadPsicoFactura(psicoId, mes)`)
Descargable desde el botón "↓ PDF" por fila en la tabla de liquidación:
- Datos de la psicóloga (nombre, email, colegiado, ciudad, DNI)
- IBAN para transferencia
- Tarifa y % IRPF
- Desglose de sesiones: regulares + externas + canceladas con cobro
- Subtotal → retención IRPF → **NETO A TRANSFERIR** destacado
- Nota de bonus trimestral si aplica
- Número de referencia (ej. `POP-EG-2026/04`)

#### Recibo individual por pago de paciente (`downloadFacturaPaciente(patId, pagoIdx)`)
Descargable desde el botón "↓ Factura" en cada fila del historial de pagos (en el modal del paciente):
- Datos del paciente (nombre, email, teléfono)
- Emisor: POP Empower
- Servicio contratado, tipo de terapia, psicóloga asignada
- Código promo utilizado (si hubo)
- Importe pagado, método de pago, estado, fecha
- Número de referencia (ej. `POP-PAC-001-1`)

#### Listado de cobros de pacientes del mes (`downloadPacientesReport(mes)`)
Descargable desde el botón "↓ PDF" en la tabla de compras del bloque de pacientes:
- Tabla con todos los pagos del mes: paciente, psicóloga, servicio, terapia, código promo, importe, método

### 9.2 Numeración de documentos

| Tipo | Formato | Ejemplo |
|---|---|---|
| Liquidación psicóloga | `POP-{iniciales}-{año}/{mes}` | `POP-EG-2026/04` |
| Recibo paciente | `POP-PAC-{id}-{nºPago}` | `POP-PAC-001-1` |

### 9.3 Lo que falta para facturación real en producción

- Generación de PDFs server-side (ej. Puppeteer) para almacenar como archivos permanentes y accesibles
- Numeración oficial correlativa y persistente (actualmente se genera en el momento, no hay registro)
- Firma electrónica en liquidaciones
- Envío automático por email al paciente cuando paga y a la psicóloga cuando se liquida
- Integración con pasarela de pago (Stripe) para que `metodoPago` y `estado` vengan del sistema real

---

## 10. Flujos de alta y onboarding

### 10.1 Alta de nueva psicóloga (admin)

1. Admin va a Gestión → Psicólogas → "+ Nueva psicóloga"
2. Rellena perfil completo (nombre, email, ciudad, colegiado, especialidades, idiomas)
3. Define tarifas (individual, IRPF, pareja si aplica, IBAN)
4. Guarda → se crea la psicóloga con `status: 'pendiente'` y `contrato: {firmado: false}`
5. Admin va al tab Contrato → "Reenviar contrato" para que firme
6. Una vez firmado, el admin cambia el estado a "activo"

### 10.2 Alta de nuevo paciente particular (admin)

1. Admin va a Gestión → Pacientes → "+ Nuevo paciente"
2. Selecciona tipo: "Particular"
3. Rellena datos (nombre, email, teléfono, psicóloga, plan, tipo terapia)
4. Opcionalmente aplica un código promo
5. Guarda → paciente creado con `status: 'activo'`

### 10.3 Alta de influencer (admin)

1. Admin va a Gestión → Pacientes → "+ Nuevo paciente"
2. Selecciona tipo: "Influencer" (pill morado)
3. Rellena datos base
4. Rellena sección "Código propio": nombre del código, sesiones gratuitas, límites, caducidad
5. Rellena sección "Código seguidores": nombre del código, % descuento, límites, caducidad
6. Pulsa "Crear paciente + 2 códigos"
7. Se crean: el paciente + dos entradas en PROMO_CODES automáticamente

Los influencers **no se registran solos**. El admin los crea manualmente porque el proceso implica acordar condiciones personalizadas con cada uno.

### 10.4 Alta de empresa B2B (admin)

1. Admin va a Gestión → Empresas → "+ Nueva empresa"
2. Rellena datos de la empresa (nombre, CIF, contacto RRHH, plan, plazas, fechas)
3. Asigna psicóloga al programa
4. Empresa queda en estado "pendiente" hasta que se confirma el contrato
5. Una vez activa, el admin puede importar participantes (empleados) via CSV o añadirlos manualmente

### 10.5 Registro de nuevo paciente (autoservicio — Onboarding.html)

El archivo `Onboarding.html` cubre el registro autónomo de nuevos pacientes particulares. Actualmente está implementado en React/JSX (cargado con Babel CDN). **Pendiente migrar a vanilla JS** para unificar con el resto de la plataforma y poder conectar con el flujo del portal del paciente.

---

## 11. Pendientes y próximos pasos

### 11.1 Inmediatos (sin backend)

| Tarea | Descripción |
|---|---|
| Migrar Onboarding.html | Pasar de React/JSX a vanilla JS, conectar con el flujo del portal del paciente |
| Pantalla de login | No existe aún. Necesaria para los 4 perfiles |
| Conectar Onboarding con Patient Portal | El flujo de registro debe desembocar en el portal ya con la sesión iniciada |

### 11.2 Para conectar con backend

| Área | Qué necesita |
|---|---|
| Autenticación | Login/logout, JWT o cookies, roles (admin/psicóloga/paciente/empresa) |
| Datos compartidos entre perfiles | API REST o GraphQL que sirva los mismos datos a Admin, Psicóloga, Paciente |
| Tarifa psicóloga | Admin edita → se propaga al `billingConfig` de la psicóloga |
| Sesiones externas | Psicóloga registra → aparece en Facturación del Admin |
| Canceladas con cobro | Psicóloga marca → aparece en Facturación del Admin |
| Bonus trimestrales | Cálculo en backend, resultado visible en Admin y dashboard psicóloga |
| Estado de liquidación | Admin marca como pagada → psicóloga lo ve en su facturación |
| Precio de renovación | Admin edita → se aplica cuando paciente renueva bono |
| Próxima sesión | Agenda de psicóloga → portal paciente (tab Inicio) |
| Pasarela de pago | Stripe o similar → campo `metodoPago` y `estado` reales en `PATIENTS.pagos[]` |
| Firma de contrato | Signaturit o DocuSign → estado en `PSYCHOLOGISTS.contrato` |
| Videollamadas | Whereby API → sala dinámica por sesión en lugar de sala fija |
| Emails / notificaciones | Alta nueva psicóloga/paciente, cambio sesión, bono próximo a caducar, liquidación emitida |
| PDFs server-side | Puppeteer o similar → facturas almacenadas como archivos permanentes, numeración correlativa |
| Importación CSV B2B | Validación server-side del CSV de empleados |

### 11.3 Funcionalidades no implementadas aún

- **Mensajería:** los tabs de mensajes existen en todos los portales pero el contenido es estático
- **Ejercicios / recursos terapéuticos:** tab existe en portal paciente, contenido por conectar
- **Documentos compartidos:** tab existe, sin funcionalidad real de subida/descarga
- **Estadísticas avanzadas:** los gráficos existen con datos mock; conectar con datos reales de sesiones y pagos
- **Notificaciones push / email:** mencionadas en varios flujos pero no implementadas
- **App móvil:** todo es responsive web; no hay versión nativa

---

## Glosario

| Término | Definición |
|---|---|
| Bono | Paquete de 4 sesiones de terapia contratadas de una vez |
| Sesión suelta | Una sola sesión sin paquete |
| Tarifa (psicóloga) | Lo que cobra la psicóloga por sesión (coste interno de POP Empower) |
| Precio (servicio) | Lo que paga el paciente por el servicio |
| Precio de renovación | Precio personalizado de un paciente para su próxima renovación de bono |
| Liquidación | Pago mensual de POP Empower a la psicóloga |
| IRPF | Retención fiscal aplicada a la liquidación de la psicóloga |
| Sesión externa | Sesión registrada por la psicóloga fuera de la plataforma (presencial u otra) |
| Cancelada con cobro | Sesión que el paciente canceló pero se cobra igualmente (por política de cancelación) |
| Bonus trimestral | Incentivo adicional para la psicóloga si sus pacientes alcanzan el umbral de sesiones en el trimestre |
| Influencer | Paciente con acuerdo especial que tiene dos códigos promo: uno para sus propias sesiones y otro para compartir con sus seguidores |
| Código propio | Código del influencer para sus sesiones personales gratuitas |
| Código seguidores | Código que el influencer comparte con su audiencia con condiciones de descuento |
| Cohorte de precio | Grupo de usuarios que comparten el mismo precio de renovación (el que tenían cuando se bloqueó el precio) |
| Plataforma | POP Empower — la plataforma en su conjunto |

---

*Documento de producto POP Empower — uso interno del equipo de desarrollo y producto.*
