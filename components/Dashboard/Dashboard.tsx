

import React, { useState, useEffect, useCallback } from 'react';
import { Client, OpportunityStage, ActionableGroup, ActionableClient, Market } from '../../types/index';
import { simulationService } from '../../services/simulationService';
import { ChevronRightIcon, LightBulbIcon } from '../Shared/Icon';

interface DashboardProps {
    onClientSelect: (client: Client | null) => void;
}

const FunnelBar: React.FC<{ stage: OpportunityStage, total: number, prevCount: number, color: string }> = ({ stage, total, prevCount, color }) => {
    const widthPercentage = total > 0 ? (stage.count / total) * 100 : 0;
    const conversionRate = prevCount > 0 ? (stage.count / prevCount) * 100 : 100;

    return (
        <div className="flex items-center space-x-4 animate-fadeIn">
            <div className="w-48 text-right pr-4">
                <p className="font-semibold text-white truncate">{stage.name}</p>
                <p className="text-sm text-gray-400">{stage.count} clientes</p>
            </div>
            <div className="flex-1">
                <div className="w-full bg-gray-700 rounded-full h-8 relative overflow-hidden">
                    <div
                        className={`${color} h-8 rounded-full flex items-center justify-end pr-3 transition-all duration-700 ease-out`}
                        style={{ width: `${widthPercentage}%` }}
                    >
                        <span className="text-sm font-bold text-white drop-shadow-md">{stage.count > 0 ? `${widthPercentage.toFixed(1)}%` : ''}</span>
                    </div>
                </div>
            </div>
            <div className="w-28 text-left pl-4">
                {prevCount > 0 && stage.count > 0 && (
                     <p className={`text-sm font-medium ${conversionRate >= 80 ? 'text-emerald-400' : conversionRate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                        {conversionRate.toFixed(1)}%
                        <span className="text-gray-500 text-xs ml-1">conv.</span>
                    </p>
                )}
            </div>
        </div>
    );
};

const ActionableClientCard: React.FC<{ client: ActionableClient, onSelect: () => void }> = ({ client, onSelect }) => (
    <button onClick={onSelect} className="w-full flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-600/50 transition-colors">
        <div className="flex items-center">
            <img src={client.avatarUrl} alt={client.name} className="w-9 h-9 rounded-full"/>
            <div className="ml-3 text-left">
                <p className="text-sm font-semibold text-white">{client.name}</p>
                <p className="text-xs text-gray-400">{client.status}</p>
            </div>
        </div>
        <ChevronRightIcon className="w-5 h-5 text-gray-500" />
    </button>
);

export const Dashboard: React.FC<DashboardProps> = ({ onClientSelect }) => {
    const [funnelData, setFunnelData] = useState<OpportunityStage[]>([]);
    const [actionableGroups, setActionableGroups] = useState<ActionableGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [allClients, setAllClients] = useState<Client[]>([]);
    const [market, setMarket] = useState<Market>('all');

    const fetchData = useCallback(async (selectedMarket: Market) => {
        setIsLoading(true);
        try {
            const [clients, funnel, groups] = await Promise.all([
                simulationService.getClients(),
                simulationService.getOpportunityStages(), // In a real app, this would also take a market filter
                simulationService.getActionableGroups()   // This too
            ]);
            
            setAllClients(clients);
            setFunnelData(funnel);
            setActionableGroups(groups);

        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(market);
    }, [fetchData, market]);

    const handleSelect = (clientId: string) => {
        const selected = allClients.find(c => c.id === clientId);
        onClientSelect(selected || null);
    };

    const totalClientsInFunnel = funnelData.length > 0 ? funnelData.reduce((acc, stage) => acc + stage.count, 0) : 0;
    const maxCount = funnelData.length > 0 ? funnelData[0].count : 0;
    const funnelColors = ['bg-primary-cyan-500', 'bg-primary-cyan-600', 'bg-primary-cyan-700', 'bg-primary-cyan-800', 'bg-primary-cyan-900'];

    return (
        <div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
            `}</style>
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Dashboard de Mando</h2>
                 <div>
                    <span className="text-sm font-medium text-gray-400 mr-3">Vista:</span>
                    <select value={market} onChange={e => setMarket(e.target.value as Market)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-primary-cyan-500 focus:border-primary-cyan-500">
                        <option value="all">Todos los Mercados</option>
                        <option value="aguascalientes">💧 Aguascalientes</option>
                        <option value="edomex">🌲 Estado de México</option>
                    </select>
                </div>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 bg-gray-900 p-6 rounded-xl border border-gray-800">
                    <h3 className="text-xl font-semibold text-white mb-4">Funnel de Conversión</h3>
                    {isLoading ? (
                         <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-cyan-400"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {funnelData.map((stage, index) => (
                                <FunnelBar 
                                    key={stage.name}
                                    stage={stage}
                                    total={maxCount}
                                    prevCount={index > 0 ? funnelData[index-1].count : 0}
                                    color={funnelColors[index % funnelColors.length]}
                                />
                            ))}
                             <div className="text-center text-gray-500 pt-4 text-xs">Total de clientes en el funnel: {totalClientsInFunnel}</div>
                        </div>
                    )}
                </div>

                <div className="space-y-8">
                     <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 animate-fadeIn" style={{animationDelay: '100ms'}}>
                        <h3 className="text-xl font-semibold text-white mb-4 flex items-center"><LightBulbIcon className="w-6 h-6 mr-3 text-amber-300"/>Alertas y Acciones Prioritarias</h3>
                        {isLoading ? (
                            <div className="text-center py-8 text-gray-400">Cargando acciones...</div>
                        ) : actionableGroups.length > 0 ? (
                            <div className="space-y-6">
                                {actionableGroups.map(group => (
                                    <div key={group.title}>
                                        <h4 className="font-semibold text-primary-cyan-300">{group.title} ({group.clients.length})</h4>
                                        <p className="text-xs text-gray-500 mb-3">{group.description}</p>
                                        <div className="space-y-2">
                                            {group.clients.map(client => (
                                                <ActionableClientCard key={client.id} client={client} onSelect={() => handleSelect(client.id)} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm">¡Excelente trabajo! No hay acciones pendientes en tu portafolio.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
