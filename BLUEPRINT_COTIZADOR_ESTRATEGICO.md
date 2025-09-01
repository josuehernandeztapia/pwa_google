# Blueprint de Ejecución: El Simulador Estratégico Unificado v2.0

## Principio Rector: La PWA como Asesor Financiero Virtual

La PWA presenta una única herramienta de modelado financiero. Esta herramienta se transforma y revela capas de complejidad basándose en las selecciones iniciales del asesor, guiándolo siempre hacia la estructuración de la oferta perfecta. Su objetivo es responder a la pregunta del transportista: *"Exactamente, ¿cómo puedo lograr tener mi unidad?"*.

## Flujo de Interacción End-to-End: Del Contacto al Cierre

### Paso 1: El Inicio - El Selector de Intención

El flujo comienza cuando el asesor presiona `+ Nueva Oportunidad` y registra el nombre del cliente. La PWA, que ahora llamaremos "Simulador de Soluciones", presenta la pregunta clave:

**"¿Qué quieres modelar para [Nombre del Cliente]?"**
- **Botón A: Adquisición de Unidad** (Activa el Modo "Cotizador")
- **Botón B: Plan de Ahorro para Renovación** (Activa el Modo "Simulador")

### Paso 2: Modo "Cotizador" (Si se selecciona "Adquisición de Unidad")

Este modo está diseñado para el cliente que ya está listo para comprar. Es rápido, contextual y transparente.

1.  **Configuración Contextual:** La PWA pide al asesor que defina el contexto:
    -   Selector de Mercado: [Aguascalientes, Estado de México]
    -   Selector de Tipo de Cliente: [Individual, Colectivo (Tanda)]
2.  **Carga del Paquete:** Basado en el contexto, la PWA carga el paquete de producto y las reglas de negocio desde Odoo (`GET /api/cotizador/paquete/:mercado`). Muestra visualmente los componentes (Vagoneta, GNV, Paquete Tec, etc.) y su costo.
3.  **Estructuración Financiera:** El asesor, junto al cliente, configura los siguientes campos interactivos:
    -   **Input de Enganche:** El campo tiene un valor mínimo pre-calculado según las reglas (ej. 15% para Colectivo en EdoMex).
    -   **Selector de Plazo:** Muestra solo los plazos permitidos para ese mercado (ej. 12/24 para AGS, 48/60 para EdoMex).
4.  **Resultados Instantáneos:** Con cada cambio, la PWA recalcula y muestra:
    -   Monto a Financiar
    -   Pago Mensual Estimado
5.  **Transparencia Total:** Un botón "Calcular y Ver Amortización" despliega la tabla de amortización completa y detallada, con una opción para "Descargar como PDF".

### Paso 3: Modo "Simulador" (Si se selecciona "Plan de Ahorro para Renovación")

Aquí es donde la herramienta se transforma en nuestro "laboratorio de escenarios".

**Configuración del Escenario:** La PWA presenta los inputs para modelar la capacidad de ahorro del cliente, adaptándose al escenario específico.

#### Escenario 1: Proyector de Ahorro y Liquidación (AGS)
-   **Input Enganche Inicial:** (ej. $400,000)
-   **Slider Fecha de Entrega:** (3 a 6 meses)
-   **Configurador de Recaudación:** Permite agregar N unidades con su Consumo Mensual y Sobreprecio.
-   **Output WOW:** Una barra visual que muestra el Valor Total, cómo se cubre con Enganche + Ahorro Proyectado, y el **REMANENTE A LIQUIDAR (ESTIMADO)**.

#### Escenario 2: Planificador de Enganche (EdoMex Individual)
-   **Meta de Enganche:** Calculada y mostrada automáticamente por la PWA.
-   **Configurador de Recaudación:** Para la unidad actual del cliente.
-   **Slider Aportación Voluntaria Mensual:** Para modelar ahorros extra.
-   **Output WOW:** Una gráfica de línea que proyecta el "Tiempo Estimado para Alcanzar el Enganche". El asesor mueve el slider de aportación y el cliente ve cómo la fecha se acerca.

#### Escenario 3: Simulador de Tanda Colectiva (EdoMex Colectivo)
-   **Slider Número de Integrantes:** (ej. 1 a 20)
-   **Inputs para Consumo Mensual Promedio y Sobreprecio.**
-   **Output WOW:** Una línea de tiempo interactiva que muestra el "efecto bola de nieve": los hitos de ahorro, las fechas estimadas de entrega de cada unidad y cómo aumenta la deuda/pago colectivo en cada paso.

**Modelado de Escenarios ("What-If"):**
El asesor puede mover los sliders en tiempo real. "¿Qué pasa si en lugar de $10 de sobreprecio, ponemos $8?", "¿Y si como grupo logran aportar $5,000 extras al mes?". La PWA recalculará y redibujará las proyecciones al instante, permitiendo al asesor y al cliente encontrar el plan perfecto.

### Paso 4: La Convergencia - "Formalizar y Continuar Proceso"

Este es el puente que conecta la simulación con la operación real.

1.  **Acción del Asesor:** Una vez que el cliente y el asesor están de acuerdo con el escenario modelado, el asesor presiona el botón principal: "Formalizar y Continuar".
2.  **Acción del Sistema:** La PWA ejecuta la acción de convergencia:
    -   Envía la cotización o simulación final al backend.
    -   El backend guarda todos los parámetros en una nueva Oportunidad en Odoo.
    -   La PWA redirige automáticamente al asesor al siguiente paso del flujo de negocio: el Expediente Digital, que ya estará pre-configurado con el checklist de documentos correcto para el escenario que acababan de definir.

### Mejoras de Flujo y UX/UI (Asesor y Cliente Asistido)

-   **Principio "Asesor Siempre Presente":** La herramienta está diseñada para ser usada con el cliente. El asesor es el piloto. La PWA es su cockpit.
-   **Visualización sobre Datos Crudos:** Reemplazar todas las tablas de configuración por componentes visuales e interactivos (sliders, checkboxes, configuradores de paquetes visuales). Los datos crudos solo aparecen en los resultados finales (tabla de amortización).
-   **Salidas Accionables:** Cada simulación debe terminar con dos salidas claras:
    -   Un PDF profesional y limpio con la cotización/simulación, que el asesor envía al instante por WhatsApp.
    -   Una Oportunidad formal en Odoo con todos los parámetros guardados.
