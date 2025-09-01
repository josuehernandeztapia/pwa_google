

import React, { useState, useEffect, useMemo } from 'react';
import { Client, OpportunityStage } from '../../types/index';
import { simulationService } from '../../services/simulationService';
import { ClientCard } from '../Shared/ClientCard';

interface OpportunitiesProps {
  onClientSelect: (client: Client | null) => void;
}

export const Opportunities: React.FC<OpportunitiesProps> = ({ onClientSelect }) => {
  const [stages, setStages] = useState<OpportunityStage[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            const [stagesData, clientsData] = await Promise.all([
                simulationService.getOpportunityStages(),
                simulationService.getClients()
            ]);
            setStages(stagesData);
            setClients(clientsData);
        } catch (error) {
            console.error("Failed to fetch opportunities data:", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchAllData();
  }, []);

  const clientsById = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);

  if (isLoading) {
      return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-cyan-400"></div></div>;
  }

  return (
    <div>
        <h2 className="text-2xl font-bold text-white mb-6">Pipeline de Oportunidades Unificado</h2>
        <div className="flex space-x-4 overflow-x-auto pb-4">
            {stages.map(stage => (
                <div key={stage.name} className="flex-shrink-0 w-80 bg-gray-900 rounded-xl border border-gray-800">
                    <div className="p-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
                        <h3 className="font-semibold text-white">{stage.name} <span className="text-sm text-gray-500">{stage.count}</span></h3>
                    </div>
                    <div className="p-4 space-y-4 overflow-y-auto h-[calc(100vh-20rem)]">
                        {stage.clientIds.map(clientId => {
                            const client = clientsById.get(clientId);
                            if (!client) return null;
                            return (
                                <ClientCard 
                                    key={client.id}
                                    client={client}
                                    isSelected={false}
                                    onSelect={() => onClientSelect(client)}
                                />
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};
