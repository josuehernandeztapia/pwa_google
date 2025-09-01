# Guía de Arquitectura y Funcionalidades: PWA del Asesor CMu v6.0 - "El Copiloto Estratégico"

## Visión General
Este documento es la fuente única de verdad para el desarrollo y mantenimiento de la PWA del Asesor de CMu. La aplicación ha evolucionado de un "cockpit de control" a un **"centro de orquestación estratégica"** y un **"copiloto proactivo e inteligente"**, permitiendo a los asesores ejecutar nuestra compleja estrategia de negocio de forma simple y guiada.

El principio rector es nuestra filosofía **"High Tech, High Touch"**: la PWA es una herramienta de poder que automatiza la complejidad y anticipa necesidades para que el asesor pueda centrarse en la relación humana con el cliente.

---

### I. Look & Feel (Apariencia y Experiencia)

La PWA está diseñada para ser una herramienta de nivel empresarial: **sofisticada, funcional y que inspira confianza**.

-   **Estética Profesional y Moderna:**
    -   Se basa en un **tema oscuro (`dark mode`)**, utilizando tonos de gris carbón (`bg-gray-800`, `bg-gray-900`). Esto reduce la fatiga visual, hace que los datos resalten y proyecta una imagen de alta tecnología.

-   **Paleta de Colores Definida:**
    -   El color de acento es un **cian vibrante (`primary-cyan`)**, usado estratégicamente para botones de acción, barras de progreso e íconos activos para crear una jerarquía visual clara.
    -   Se utilizan colores de estado (verde para éxito, ámbar para advertencia, rojo para error) para comunicar información de un vistazo.

-   **Tipografía Clara y Legible:**
    -   Utilizamos una fuente **sans-serif** (estándar de Tailwind CSS), que es limpia y moderna, garantizando una excelente legibilidad.

-   **Experiencia de Usuario (UX) Reactiva y Centrada en el Asesor:**
    -   **Reactiva:** La interfaz responde instantáneamente con retroalimentación visual (efectos `hover`, `spinners` de carga) y notificaciones no intrusivas (`toasts`).
    -   **Enfocada en la Tarea:** El uso de **modales** para acciones complejas centra la atención del asesor, minimizando errores.

---

### II. Estructura y Arquitectura de la Información

La arquitectura está diseñada para ser **escalable, modular y, sobre todo, intuitiva**.

-   **Estructura de Tres Paneles (Cockpit de Control):**
    1.  **Barra Lateral Adaptativa (Izquierda):** Navegación principal, colapsable en escritorio para maximizar el espacio.
    2.  **Encabezado Superior Fijo (Arriba):** Título, acciones globales y el centro de notificaciones proactivo.
    3.  **Área de Contenido Principal (Centro/Derecha):** El núcleo de la experiencia, con una estructura contextual.

-   **Navegación Jerárquica Unificada (Rutas ➔ Grupos ➔ Miembros):**
    -   La PWA abandona los silos de información. La sección **"Ecosistemas (Rutas)"** ahora funciona como un mapa interactivo. El asesor puede hacer *drill-down* desde una vista general de todas las rutas, a los grupos de una ruta específica, y finalmente a los miembros de un grupo, todo dentro de un flujo único y coherente.
    -   Un **`Breadcrumb` (miga de pan) dinámico y clickeable** (`Ruta 27 > Grupo CC-MAYO > Luis Pérez`) está siempre visible, actuando como un "GPS" que permite al asesor entender su ubicación en la jerarquía y navegar hacia arriba con facilidad.

-   **Arquitectura de Componentes Modulares:**
    -   **Componentes Reutilizables:** Construida con componentes bien definidos (`Modal.tsx`, `Toast.tsx`, etc.), garantizando consistencia.
    -   **Separación de Lógica y Presentación:** La lógica de negocio está encapsulada en `services/simulationService.ts`. La UI solo muestra datos y captura acciones.
    -   **Fuente Única de Verdad para los Tipos (`types.ts`):** Todos los modelos de datos (`Client`, `Notification`, etc.) están definidos en un solo lugar.

---

### III. Flujos de Negocio y el Simulador Estratégico Unificado v2.0

La PWA opera como un **Motor de Reglas de Negocio** que guía al asesor a través de nuestro "Árbol de Decisión Definitivo", comenzando con el flujo del **Simulador Estratégico Unificado v2.0**.

#### **Paso 1: El Inicio - El Selector de Intención (`Header.tsx`)**
El flujo de modelado financiero actúa como un **asesor virtual**, siguiendo el [Blueprint del Cotizador Estratégico v2.0](./BLUEPRINT_COTIZADOR_ESTRATEGICO.md).

Al presionar `+ Nueva Oportunidad`, un asistente define la **intención** de la oportunidad:
- **`Adquisición de Unidad`** -> Activa el **Modo Cotizador**, para clientes listos para comprar.
- **`Plan de Ahorro para Renovación`** -> Activa el **Modo Simulador**, para clientes que necesitan planificar.

#### **Paso 2: La Bifurcación Maestra por Tipo de Venta y Mercado**
El asistente continúa con la cualificación, permitiendo al `simulationService` crear una oportunidad con el `BusinessFlow` y el checklist de documentos exacto.

#### **Paso 3: El Simulador Contextual y Visual (`Cotizador.tsx`)**
Una vez creada la oportunidad, la PWA navega al `Cotizador`, que se transforma según la intención:

1.  **Modo Cotizador (`acquisition`):** Presenta una interfaz transaccional para configurar el paquete de producto (respetando las unidades por mercado), la estructura financiera (o de pago para Venta Directa) y generar la tabla de amortización.

2.  **Modo Simulador (`savings`) - El Laboratorio de Escenarios:** La herramienta se convierte en un laboratorio visual para modelar escenarios de ahorro, presentando una de tres interfaces específicas:
    -   **Escenario 1 (AGS - Ahorro y Liquidación):** Muestra un **`RemainderBar`**, una barra visual que desglosa el costo total, el enganche aportado, el ahorro proyectado por recaudación y el **remanente a liquidar**.
    -   **Escenario 2 (EdoMex Individual - Planificador):** Presenta un **`SavingsProjectionChart`**, una gráfica interactiva que proyecta el "Tiempo Estimado para Alcanzar el Enganche", actualizándose en tiempo real con un slider de aportación voluntaria.
    -   **Escenario 3 (EdoMex Colectivo - Tanda):** Despliega la **`TandaTimeline`**, una línea de tiempo que visualiza el "efecto bola de nieve de la deuda", mostrando cómo aumenta la responsabilidad de pago colectivo con cada unidad entregada. La lógica completa está documentada en el [`PLAYBOOK.md`](./PLAYBOOK.md).

Este flujo garantiza que el asesor siempre utilice la herramienta correcta para la necesidad del cliente, cumpliendo con el principio rector de ser un Asesor Financiero Virtual.

---

### IV. Experiencia de Clase Mundial (Fase 5)

Para alcanzar el estándar de "Clase Mundial", la PWA incorpora funcionalidades avanzadas que mejoran la productividad, la usabilidad en cualquier dispositivo y el soporte al asesor.

-   **Navegación Adaptativa:**
    -   **Sidebar Colapsable (Desktop):** En escritorio, la barra lateral puede ser colapsada a un modo de solo iconos. Esto maximiza el espacio disponible para visualizar datos complejos, como tablas o dashboards, sin perder el acceso rápido a las diferentes secciones.
    -   **Barra de Navegación Inferior (Mobile):** En pantallas pequeñas, la PWA adopta un paradigma *mobile-first*. La barra lateral se oculta y es reemplazada por una barra de navegación inferior fija.

-   **Vistas de Datos Avanzadas:**
    -   **Selector de Vista (Cards vs. DataGrid):** En la sección "Clientes", se ha añadido un selector que permite al usuario cambiar entre una vista de tarjetas (visual y rápida) y una vista de tabla de datos (DataGrid). La tabla ofrece densidad de información y la capacidad de ordenar por columnas, ideal para asesores que gestionan grandes carteras.

-   **Sistema de Ayuda Embebida ("High Touch"):**
    -   **Tooltips Enriquecidos:** Para reducir la curva de aprendizaje, se han implementado tooltips contextuales mejorados que ofrecen explicaciones detalladas y guías, encarnando el principio "High Touch".

-   **Funcionalidades Proactivas:**
    -   **Motor de "Próxima Mejor Acción" (`NextBestAction.tsx`):** Un solo componente inteligente analiza el estado del cliente y presenta la acción más crítica y relevante a tomar, guiando al asesor.
    -   **Sistema de Alertas Inteligentes (`NotificationsPanel.tsx`):** El panel de notificaciones es proactivo, permitiendo navegación directa a expedientes de clientes y ofreciendo botones de acción contextuales.
    -   **Navegación con Alertas (`Sidebar.tsx`):** `Badges` numéricos en la barra lateral indican las secciones que requieren atención, permitiendo al asesor priorizar su trabajo de un vistazo.
