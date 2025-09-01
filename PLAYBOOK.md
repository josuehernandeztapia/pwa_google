# Playbook de Reglas de Negocio v1.1

Este documento es la fuente única de verdad para todas las reglas, lineamientos y requisitos por producto y mercado. La PWA del asesor debe ser programada para ejecutar y validar estas reglas automáticamente.

## 1. Mercado: Aguascalientes
**Modelo de Negocio Principal:** Venta Individual, enfocada en clientes con alta liquidez.
**Colateral Social:** No se requiere Carta Aval ni Convenio de Dación en Pago.

### Producto: Venta Directa (Contado)
| Atributo | Regla / Requisito |
| :--- | :--- |
| **Paquete Base** | Vagoneta H6C (19 Pasajeros) - $799,000 MXN. |
| **Modelo de Unidad** | Vagoneta H6C (19 Pasajeros). |
| **Componentes** | Conversión GNV ($54,000 MXN) es **opcional**. El asesor debe confirmar con el cliente si se incluye. |
| **Expediente Requerido** | Express: INE Vigente, Comprobante de Domicilio, Constancia de Situación Fiscal. |
| **Contrato** | Contrato de Compraventa simple. |
| **Forma de Pago** | SPEI (Transferencia) por el monto total, generado desde la PWA del asesor. |

### Producto: Venta a Plazo (Remanente)
| Atributo | Regla / Requisito |
| :--- | :--- |
| **Paquete Base** | Vagoneta H6C (19 Pasajeros) con Conversión GNV **incluida por defecto**. Valor total: $853,000 MXN. |
| **Modelo de Unidad** | Vagoneta H6C (19 Pasajeros). |
| **Límite de Financiamiento** | Se puede financiar un **máximo del 40%** del valor total del paquete ($341,200 MXN). |
| **Enganche Mínimo** | **60%** del valor total del paquete ($511,800 MXN). |
| **Plazos Disponibles** | 12 y 24 meses únicamente. |
| **Tasa de Interés Fija**| 25.5% anual. |
| **Expediente Requerido** | Individual: INE Vigente, Comprobante de domicilio, Tarjeta de circulación, Concesión, Constancia de situación fiscal. |
| **Contrato** | Contrato de Venta a Plazo. |

---

## 2. Mercado: Estado de México (EdoMex)
**Modelo de Negocio Principal:** Ecosistema "Route-First", basado en colateral social.
**Colateral Social:** Se requiere Convenio Marco con la Ruta, y Carta Aval + Convenio de Dación en Pago por cada miembro.

### Producto: Venta Directa (Contado)
| Atributo | Regla / Requisito |
| :--- | :--- |
| **Paquete Base** | Vagoneta H6C (Ventanas) - $749,000 MXN. |
| **Modelo de Unidad** | Vagoneta H6C (Ventanas). |
| **Componentes** | El asesor debe seleccionar una de dos opciones: `( ) Solo Unidad Base` o `( ) Incluir Paquete Productivo Completo`. |
| **Expediente Requerido** | Express: INE Vigente, Comprobante de Domicilio, Constancia de Situación Fiscal. |
| **Contrato** | Contrato de Compraventa simple. |
| **Forma de Pago** | SPEI (Transferencia) por el monto total. |

### Producto: Venta a Plazo (Individual o Colectivo)
| Atributo | Regla / Requisito |
| :--- | :--- |
| **Paquete Base** | Paquete Productivo Completo es **obligatorio y no opcional**. Incluye Vagoneta ($749k), GNV ($54k), Paquete Tec ($12k) y Bancas ($22k). |
| **Modelo de Unidad** | Vagoneta H6C (Ventanas). |
| **Seguro** | Se financia por defecto. El costo anual de $36,700 MXN se multiplica por los años del plazo y se suma al valor total. Es opcional solo si el cliente presenta una póliza externa validada. |
| **Enganche Mínimo** | **Individual:** 15-20% (default 20%). **Colectivo (Tanda):** 15% (incentivo). |
| **Plazos Disponibles** | 48 y 60 meses únicamente. |
| **Tasa de Interés Fija**| 29.9% anual. |
| **Pago Híbrido** | El plan de pagos mensual puede combinar Recaudación por GNV (con sobreprecio no mayor a $10.00) y Aportaciones Voluntarias. El asesor lo configura en la PWA. |
| **Expediente Requerido** | **Completo:** Todos los documentos del individual de AGS MÁS Factura de unidad actual, Carta Aval de Ruta y Convenio de Dación en Pago. |
| **Contrato** | Contrato de Venta a Plazo (con cláusulas de pago híbrido y colateral social). |

### Producto: Ahorro Programado / Tanda (Solo EdoMex)
| Atributo | Regla / Requisito |
| :--- | :--- |
| **Contrato Inicial** | Contrato Promesa de Compraventa. |
| **Meta de Ahorro** | El enganche correspondiente al plan de Venta a Plazo (ej. 15% del paquete completo para una Tanda). |
| **Método de Ahorro** | Híbrido por defecto. Se pueden activar Recaudación y/o Aportaciones Voluntarias. |
| **Expediente Requerido**| Básico: INE, Comprobante de Domicilio. Si se activa el recaudo, se añade Tarjeta de Circulación y Concesión. |
| **Conversión a Venta** | Al alcanzar la meta, la PWA inicia el flujo de Venta a Plazo, aplicando el saldo ahorrado como enganche y solicitando el resto del expediente completo. |

---
### **Blueprint de Lógica y Modelo de Datos para el Módulo de Tanda**

#### **1. El Concepto: De Ahorro Colectivo a Deuda Colectiva Escalonada**

El principio es simple: un grupo de `N` miembros ahorra en conjunto para el enganche de la primera unidad. Una vez entregada, el grupo empieza a pagar la deuda de esa primera unidad **Y SIMULTÁNEAMENTE** empieza a ahorrar para el enganche de la segunda. Este ciclo se repite, creando un "efecto bola de nieve" donde la responsabilidad de pago mensual del grupo aumenta con cada unidad entregada.

#### **2. El Modelo de Datos (Las Entidades Clave)**

Para que un sistema entienda esto, necesita estructurar la información en tres objetos principales:

  * **El Objeto `Tanda` (El Contenedor Principal):**
    Representa al grupo completo y su estado general.

    ```json
    {
      "tandaId": "TANDA_RUTA25_01",
      "nombre": "Tanda Ruta 25 - Primeras 5",
      "estado": "PAGO_Y_AHORRO", // AHORRO_INICIAL, PAGO_Y_AHORRO, PAGO_FINAL
      "numeroMiembros": 5,
      "unidadesEntregadas": 1,
      "metaEnganchePorUnidad": 153075.00,
      "pagoMensualPorUnidad": 25720.52
    }
    ```

  * **El Objeto `MiembroTanda` (El Participante):**
    Representa a cada individuo dentro del grupo.

    ```json
    {
      "miembroId": "CLIENTE_007",
      "tandaId": "TANDA_RUTA25_01",
      "nombre": "Javier Rodriguez",
      "estado": "ACTIVO", // ACTIVO, PENDIENTE_ACTIVACION
      "totalAportadoPersonal": 65200.00
    }
    ```

  * **El Objeto `CicloTanda` (El Estado Financiero Actual):**
    Este es el objeto más importante. Representa la **fase actual** del grupo: para qué unidad están ahorrando y cuántas deudas están pagando.

    ```json
    {
      "cicloId": "CICLO_TANDA_R25_01_U2",
      "tandaId": "TANDA_RUTA25_01",
      "numeroCiclo": 2, // Ahorrando para la unidad #2
      "metaAhorroCiclo": 153075.00, // Siempre es el enganche
      "ahorroAcumuladoCiclo": 45100.00, // Lo que llevan para el enganche #2
      "metaPagoMensualCiclo": 25720.52, // La deuda de la unidad #1
      "pagoAcumuladoMesCiclo": 18300.00 // Lo que han pagado de la deuda este mes
    }
    ```

#### **3. La Lógica de Transición de Estados (El Algoritmo "Bola de Nieve")**

Este es el proceso que el sistema debe ejecutar.

1.  **Inicio (Ciclo 1):** Se crea una `Tanda` con estado `AHORRO_INICIAL`. Su primer `CicloTanda` tiene `numeroCiclo: 1` y `metaPagoMensualCiclo: 0`. El único objetivo es llenar el `ahorroAcumuladoCiclo`.

2.  **Trigger: Meta de Ahorro Alcanzada.** El sistema detecta que `ahorroAcumuladoCiclo >= metaAhorroCiclo`.

      * **Acción:** Se entrega la primera unidad.

3.  **Transición al Siguiente Ciclo:**

      * Se incrementa `Tanda.unidadesEntregadas` a `1`.
      * Se crea un nuevo `CicloTanda` con `numeroCiclo: 2`.
      * Se resetea `ahorroAcumuladoCiclo` a `0`.
      * Se **recalcula** la `metaPagoMensualCiclo` del nuevo ciclo: `Tanda.pagoMensualPorUnidad * Tanda.unidadesEntregadas`. (Ahora es $25,720.52).
      * El estado de la `Tanda` cambia a `PAGO_Y_AHORRO`.

4.  **Repetir:** El proceso se repite. El grupo ahora tiene que cumplir dos metas cada mes. Cuando vuelven a alcanzar la `metaAhorroCiclo`, se entrega la unidad 2, `unidadesEntregadas` sube a `2`, y la `metaPagoMensualCiclo` del nuevo `Ciclo 3` se duplica a `$51,441.04`.

5.  **Fase Final:** Cuando `unidadesEntregadas` es igual a `numeroMiembros`, el estado de la `Tanda` cambia a `PAGO_FINAL`. El sistema deja de crear nuevos ciclos de ahorro. El único objetivo es cumplir con la `metaPagoMensualCiclo` máxima hasta que todas las deudas se liquiden.

#### **4. La Conciliación de Pagos**

Cuando llega un pago (sea por recaudo o voluntario):

1.  Se identifica al `MiembroTanda`.
2.  El sistema consulta el `CicloTanda` actual.
3.  Se aplica el dinero según una regla (ej. 50% a pago de deuda, 50% a ahorro) a los campos `pagoAcumuladoMesCiclo` y `ahorroAcumuladoCiclo`.
