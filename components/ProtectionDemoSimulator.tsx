import React, { useState, FormEvent } from 'react';
import { ProtectionScenario } from '../types';
import { simulationService } from '../services/simulationService';
import { toast } from './Toast';
import { ScenarioCard } from './ScenarioCard';

interface ProtectionDemoSimulatorProps {
  baseQuote: {
    amountToFinance: number;
    monthlyPayment: number;
    term: number;
  };
  onClose: () => void;
}

export const ProtectionDemoSimulator: React.FC<ProtectionDemoSimulatorProps> = ({ baseQuote, onClose }) => {
  const [months, setMonths] = useState('2');
  const [scenarios, setScenarios] = useState<ProtectionScenario[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSimulate = async (e: FormEvent) => {
    e.preventDefault();
    const numMonths = parseInt(months, 10);
    if (isNaN(numMonths) || numMonths <= 0) {
      toast.error("Por favor, introduce un número de meses válido.");
      return;
    }
    setIsLoading(true);
    try {
      const results = await simulationService.simulateProtectionDemo(baseQuote, numMonths);
      setScenarios(results);
      if (results.length === 0) {
          toast.info("No se pudieron generar escenarios. El plazo restante es muy corto.");
      }
    } catch (error) {
      toast.error("Error al simular la demostración.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400">
        Esta es una demostración de cómo funciona nuestra Protección para Conductores. La simulación asume que el cliente solicita la protección 1 año después de iniciar su crédito.
      </p>
      <form onSubmit={handleSimulate} className="flex items-end gap-4 p-4 bg-gray-900 rounded-lg">
        <div>
          <label htmlFor="months-demo" className="block text-sm font-medium text-gray-300">Meses Afectados</label>
          <input
            type="number"
            id="months-demo"
            value={months}
            onChange={e => setMonths(e.target.value)}
            min="1"
            max="6"
            required
            className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
          />
        </div>
        <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-primary-cyan-600 rounded-lg hover:bg-primary-cyan-700 disabled:opacity-50">
          {isLoading ? 'Calculando...' : 'Simular Escenarios'}
        </button>
      </form>

      {isLoading && scenarios.length === 0 && (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-cyan-400"></div></div>
      )}
      
      {scenarios.length > 0 && (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Resultados de la Simulación:</h3>
            {scenarios.map(scenario => (
                <ScenarioCard 
                    key={scenario.type}
                    scenario={scenario}
                />
            ))}
        </div>
      )}
      
      <div className="flex gap-4 pt-4 border-t border-gray-700">
        <button onClick={onClose} className="w-full px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500">Cerrar</button>
      </div>
    </div>
  );
};