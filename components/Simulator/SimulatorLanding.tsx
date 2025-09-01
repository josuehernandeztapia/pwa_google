import React from 'react';
import { CalculatorIcon, PlusCircleIcon } from '../Shared/Icon';

interface SimulatorLandingProps {
    onNewOpportunity: () => void;
}

export const SimulatorLanding: React.FC<SimulatorLandingProps> = ({ onNewOpportunity }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-400">
            <CalculatorIcon className="w-24 h-24 text-gray-600 mb-6" />
            <h2 className="text-3xl font-bold text-white mb-2">Simulador de Soluciones</h2>
            <p className="max-w-md mb-8">
                Nuestro simulador ahora es una herramienta contextual. Para modelar una solución,
                primero necesitas crear una oportunidad para un cliente.
            </p>
            <button
                onClick={onNewOpportunity}
                className="flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-primary-cyan-600 rounded-lg hover:bg-primary-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary-cyan-500 transition-colors"
            >
                <PlusCircleIcon className="w-6 h-6 mr-3" />
                Iniciar Nueva Oportunidad
            </button>
        </div>
    );
};
