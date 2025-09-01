import React from 'react';
import { ChipIcon } from './icons';

const integrations = [
    {
        name: "Odoo",
        role: "CRM, Contabilidad y Fuente de Verdad para datos de clientes.",
        priority: "P1 - Crítico",
        priorityColor: "border-red-500"
    },
    {
        name: "API de GNV",
        role: "Habilita el ahorro y pago por recaudación en consumo de combustible.",
        priority: "P1 - Crítico",
        priorityColor: "border-red-500"
    },
    {
        name: "Conekta / SPEI",
        role: "Procesa todas las aportaciones voluntarias de los clientes.",
        priority: "P1 - Crítico",
        priorityColor: "border-red-500"
    },
    {
        name: "Metamap",
        role: "Provee la verificación de identidad biométrica (KYC).",
        priority: "P2 - Funcionalidad Clave",
        priorityColor: "border-amber-400"
    },
    {
        name: "Mifiel",
        role: "Gestiona la firma electrónica de todos los contratos.",
        priority: "P2 - Funcionalidad Clave",
        priorityColor: "border-amber-400"
    },
    {
        name: "KIBAN / HASE",
        role: "Realiza el análisis de riesgo crediticio.",
        priority: "P2 - Funcionalidad Clave",
        priorityColor: "border-amber-400"
    }
];

export const Integrations: React.FC = () => {
  return (
    <div>
        <h2 className="text-2xl font-bold text-white mb-6">Mapa de Batalla de Integraciones</h2>
        <p className="text-gray-400 mb-8 max-w-3xl">Esta es la guía para el equipo técnico. Cada tarjeta representa una conexión externa que debe ser construida en el backend. La PWA ya está preparada para consumir los endpoints correspondientes.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {integrations.map((integ) => (
                 <div key={integ.name} className={`bg-gray-800 border-l-4 ${integ.priorityColor} rounded-r-lg p-6 flex flex-col shadow-lg`}>
                    <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold text-white">{integ.name}</h3>
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300">
                            SIMULADO
                        </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-2 flex-1">{integ.role}</p>
                    <div className="mt-4">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${integ.priorityColor.replace('border-','bg-')}/20 ${integ.priorityColor.replace('border-','text-')}`}>
                            {integ.priority}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};