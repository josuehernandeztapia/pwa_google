import React from 'react';
import { ProtectionScenario } from '../../types/index';
import { CheckCircleIcon } from './Icon';

interface ScenarioCardProps {
  scenario: ProtectionScenario;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, isSelected, onSelect }) => {
  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  return (
    <button
      onClick={onSelect}
      disabled={!onSelect}
      className={`w-full text-left p-5 border-2 rounded-lg transition-all duration-200 relative ${isSelected ? 'bg-primary-cyan-900/40 border-primary-cyan-600' : 'bg-gray-800 border-gray-700'} ${onSelect ? 'hover:border-gray-600 cursor-pointer' : 'cursor-default'}`}
    >
      {isSelected && onSelect && (
        <div className="absolute top-3 right-3 p-1 bg-primary-cyan-600 rounded-full">
          <CheckCircleIcon className="w-6 h-6 text-white" />
        </div>
      )}
      <h4 className="font-bold text-white text-xl">{scenario.title}</h4>
      <p className="text-base text-gray-400 mt-1">{scenario.description}</p>
      <div className="mt-4 pt-4 border-t border-gray-700 space-y-2">
        {scenario.details.map((detail, index) => (
          <p key={index} className="text-base text-gray-200">{detail}</p>
        ))}
        <div className="flex justify-between items-baseline pt-2">
            <span className="text-base font-semibold text-white">Nuevo Plazo:</span>
            <span className="text-lg font-mono font-bold text-white">{scenario.newTerm} meses ({scenario.termChange >= 0 ? '+' : ''}{scenario.termChange})</span>
        </div>
      </div>
    </button>
  );
};
