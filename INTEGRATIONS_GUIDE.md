# Guía Quirúrgica de Integraciones para la Plataforma CMu v4.0

## Principio Rector
Este documento es la fuente única de verdad para el equipo técnico de backend (NestJS). Su propósito es guiar la construcción y conexión de todas las integraciones externas necesarias para que la PWA del Asesor (el "cockpit") pase de estar **SIMULADA** a estar **OPERATIVA**.

Cada integración listada a continuación tiene una contraparte funcional en el `simulationService.ts` de la PWA. El objetivo es reemplazar cada llamada a la simulación por una llamada a un endpoint real de nuestra API.

### Sistema de Prioridades
- **P1 - Crítico para Operar:** Integraciones sin las cuales el flujo de negocio principal (generación de ingresos) no puede funcionar.
- **P2 - Funcionalidad de Negocio Clave:** Integraciones que habilitan flujos de negocio importantes y refuerzan nuestra propuesta de valor.
- **P3 - Mejoras y Optimizaciones:** Integraciones que mejoran la experiencia o la eficiencia operativa.

---

## 1. Odoo
- **Prioridad:** **P1 - Crítico**
- **Rol en el Ecosistema:** Es el **cerebro y la fuente única de verdad** para todos los datos de clientes, contratos, estados de cuenta y contabilidad. El backend de NestJS debe actuar como una capa de abstracción (BFF - Backend for Frontend) para Odoo.

### Endpoints Principales
  - `GET /api/clients`: Devuelve la lista completa de clientes con sus datos anidados.
  - `GET /api/clients/:id`: Devuelve los datos actualizados de un solo cliente.
  - `POST /api/events`: Registra un nuevo evento en el historial del cliente.
  - `POST /api/savings-plans`: Crea una nueva cuenta analítica en Odoo para un Plan de Ahorro.
  - `POST /api/payment-plans`: Configura la estructura contable para una Venta a Plazo.
  - `GET /api/collective-credit-groups`: Devuelve los grupos de Crédito Colectivo y sus miembros.
  - `POST /api/collective-credit-groups`: (HU #14) Crea un nuevo grupo de Crédito Colectivo, generando una **Cuenta Analítica Maestra** en Odoo para el grupo.
  - `POST /api/collective-credit-groups/:id/transition-to-payment`: (HU #16) Transiciona un grupo de la fase de ahorro a la de pago colectivo.

### Endpoints del Cotizador
- **Prioridad:** **P2 - Funcionalidad Clave**
  - `GET /api/cotizador/paquete/:mercado`: (HU #18) Obtiene desde Odoo la configuración completa de un "Paquete de Producto" específico para un mercado (ej. 'edomex', 'aguascalientes'). La respuesta debe incluir todos los componentes, precios, tasas de interés, plazos permitidos y reglas de negocio (ej. % de enganche mínimo).
  - `POST /api/cotizador/save`: (HU #21) Recibe la configuración final de una cotización y su tabla de amortización generada desde la PWA. El backend debe guardar esta información como un registro oficial (JSON o PDF adjunto) en la oportunidad del cliente en Odoo.

- **Flujo de Datos:**
  1. La PWA solicita datos al backend de NestJS.
  2. NestJS consulta las Cuentas Analíticas, Contactos y Órdenes de Venta en Odoo.
  3. NestJS formatea los datos y los envía a la PWA.
- **Notas Técnicas:**
  - La correcta estructuración de las **Cuentas Analíticas** en Odoo es la clave del éxito. Cada cliente con un plan y cada grupo de crédito colectivo deben tener una para una trazabilidad financiera impecable.
  - **Crucial:** El modelo de datos en Odoo debe ser lo suficientemente flexible para:
    a) Almacenar y asociar diferentes **checklists de documentos** por tipo de oportunidad (Contado, Financiero-AGS, Financiero-EDOMEX).
    b) Establecer y consultar la **relación entre un `Contacto` (Cliente) y un `Ecosistema`** (otra entidad de Contacto o modelo personalizado) para el flujo del Edo. de México.

## 2. API de GNV
- **Prioridad:** **P1 - Crítico**
- **Rol en el Ecosistema:** Habilita el corazón de nuestro modelo de negocio flexible: el **ahorro y pago a través de recaudación por consumo de combustible**.
- **Endpoints Requeridos (Backend NestJS):**
  - `POST /api/gnv/activate-collection`: Recibe `placas` y `sobreprecio`. Llama a la API externa de GNV para registrar la regla. (HU #12)
  - `POST /api/gnv/webhook/consumption`: Endpoint seguro para recibir los datos de consumo y recaudo diarios desde el sistema de GNV. (HU #13)
- **Flujo de Datos:**
  1. **Activación:** PWA -> NestJS -> API de GNV.
  2. **Recaudación:** Sistema de GNV -> Webhook en NestJS -> NestJS procesa los datos y registra la aportación en la cuenta analítica del cliente en Odoo.
- **Notas Técnicas:** La seguridad del webhook de consumo es crítica. Se debe implementar validación de origen y manejo de transacciones duplicadas o placas no reconocidas.

## 3. Conekta / SPEI
- **Prioridad:** **P1 - Crítico**
- **Rol en el Ecosistema:** Procesa todas las **aportaciones voluntarias** de los clientes, tanto para ahorro como para pagos de mensualidades.
- **Endpoints Requeridos (Backend NestJS):**
  - `POST /api/payments/generate-link`: Recibe `clientId` y `amount`. Implementa la lógica de negocio: si el monto es `> $20,000 MXN`, genera datos para SPEI; si no, crea una orden de pago en Conekta y devuelve el link.
  - `POST /api/payments/webhook/conekta`: Webhook seguro para recibir la confirmación de pagos realizados.
- **Flujo de Datos:**
  1. **Generación:** PWA solicita la liga -> NestJS llama a la API de Conekta/genera datos SPEI -> NestJS devuelve los datos a la PWA.
  2. **Confirmación:** Cliente paga -> Conekta notifica a nuestro webhook -> NestJS registra el pago en la cuenta analítica del cliente en Odoo (usando el **diario contable correcto** `CNK`).
- **Notas Técnicas:** El webhook debe ser idempotente para evitar registros duplicados.

## 4. Metamap
- **Prioridad:** **P2 - Funcionalidad Clave**
- **Rol en el Ecosistema:** Provee la **verificación de identidad biométrica (KYC)**, digitalizando y asegurando el proceso de onboarding.
- **Endpoints Requeridos (Backend NestJS):**
  - `POST /api/kyc/webhook/metamap`: Webhook seguro para recibir el resultado de una verificación.
- **Flujo de Datos:**
  1. El frontend renderiza el botón de Metamap.
  2. Metamap notifica directamente a nuestro webhook de backend.
  3. NestJS recibe el resultado, actualiza el estado del documento en Odoo y, si es "Revisión Manual", crea una tarea en Airtable.
- **Notas Técnicas:** La PWA ya tiene la lógica del frontend. El backend solo necesita implementar el listener del webhook.

## 5. Mifiel
- **Prioridad:** **P2 - Funcionalidad Clave**
- **Rol en el Ecosistema:** Gestiona la **firma electrónica legalmente vinculante** de todos los contratos.
- **Endpoints Requeridos (Backend NestJS):**
  - `POST /api/contracts/send`: Recibe `clientId` y `contractType`.
  - `POST /api/contracts/webhook/mifiel`: Webhook para recibir notificaciones sobre el estado del proceso de firma.
- **Flujo de Datos:**
  1. **Envío:** La PWA dispara la acción -> NestJS obtiene datos de Odoo, genera el documento y lo envía a la API de Mifiel.
  2. **Estado:** Mifiel notifica a nuestro webhook -> NestJS actualiza la etapa del cliente en el CRM de Odoo (ej. "Promesa Firmada").
- **Notas Técnicas:** La automatización vía webhook es clave para mover al cliente a través del pipeline sin intervención manual.

## 6. KIBAN / HASE
- **Prioridad:** **P2 - Funcionalidad Clave**
- **Rol en el Ecosistema:** Realiza el **análisis de riesgo crediticio**, consultando buró de crédito (KIBAN) y aplicando nuestro modelo de riesgo interno (HASE).
- **Endpoints Requeridos (Backend NestJS):**
  - `POST /api/credit/analyze`: Recibe `clientId`.
- **Flujo de Datos:**
  1. Flujo 100% de backend, disparado por una acción en la PWA.
  2. NestJS obtiene el expediente del cliente desde Odoo.
  3. NestJS orquesta las llamadas: primero a KIBAN, luego a HASE.
  4. NestJS recibe el score final y actualiza el estado del cliente en Odoo a "Aprobado" o "Rechazado".
- **Notas Técnicas:** La PWA solo necesita reflejar el estado final. La complejidad reside en el backend.

---

## 7. Servicio de WebSocket
- **Prioridad:** **P2 - Funcionalidad Clave**
- **Rol en el Ecosistema:** Provee la comunicación en tiempo real entre el backend y la PWA, habilitando el **Sistema de Alertas Inteligentes** (HU #19) y la actualización instantánea de datos en el dashboard.
- **Eventos a Emitir (Backend -> Frontend):**
  - `notification:new`: Envía una nueva alerta al asesor.
  - `client:updated`: Informa a la PWA que los datos de un cliente han cambiado, para que pueda refrescar la vista.
  - `eventlog:new`: Empuja un nuevo evento al historial del cliente en tiempo real.
- **Flujo de Datos:**
  1. Un evento de negocio ocurre en el backend (ej. un webhook de Conekta confirma un pago).
  2. Después de procesar el evento (actualizar Odoo), el backend emite un evento WebSocket (`client:updated`, `notification:new`).
  3. La PWA recibe el evento y actualiza la UI correspondientemente sin necesidad de recargar la página.
- **Notas Técnicas:** Se debe implementar un `WebSocketGateway` en NestJS. La PWA deberá establecer una conexión persistente al iniciar la sesión del asesor.
