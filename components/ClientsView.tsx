
import React, { useState, useMemo } from 'react';
import { Client, BusinessFlow } from '../types';
import { BUSINESS_FLOWS, ALL_FLOWS } from '../constants';
import { ClientCard } from './ClientCard';
import { ViewGridIcon, ViewListIcon } from './icons';

interface ClientsViewProps {
  clients: Client[];
  onClientSelect: (client: Client | null) => void;
}

type ViewMode = 'grid' | 'list';
type SortKey = keyof Client | 'healthScore';

const ClientsDataGrid: React.FC<{ clients: Client[], onClientSelect: (client: Client) => void, onSort: (key: SortKey) => void, sortConfig: { key: SortKey, direction: 'ascending' | 'descending'} | null }> = ({ clients, onClientSelect, onSort, sortConfig }) => {
    
    const getSortIndicator = (key: SortKey) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
    };

    return (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-800">
                        <tr>
                            <th scope="col" className="px-6 py-3">
                                <button onClick={() => onSort('name')} className="flex items-center gap-1">Nombre {getSortIndicator('name')}</button>
                            </th>
                            <th scope="col" className="px-6 py-3">
                                <button onClick={() => onSort('flow')} className="flex items-center gap-1">Flujo de Negocio {getSortIndicator('flow')}</button>
                            </th>
                            <th scope="col" className="px-6 py-3">
                                <button onClick={() => onSort('status')} className="flex items-center gap-1">Estatus {getSortIndicator('status')}</button>
                            </th>
                            <th scope="col" className="px-6 py-3">
                                <button onClick={() => onSort('healthScore')} className="flex items-center gap-1">Health Score {getSortIndicator('healthScore')}</button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.map(client => (
                            <tr key={client.id} onClick={() => onClientSelect(client)} className="bg-gray-800/50 border-b border-gray-700/50 hover:bg-gray-700/50 cursor-pointer">
                                <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap flex items-center">
                                    <img src={client.avatarUrl} alt={client.name} className="w-8 h-8 rounded-full mr-3"/>
                                    {client.name}
                                </th>
                                <td className="px-6 py-4">{client.flow}</td>
                                <td className="px-6 py-4">{client.status}</td>
                                <td className="px-6 py-4 font-mono">{client.healthScore || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


export const ClientsView: React.FC<ClientsViewProps> = ({ clients, onClientSelect }) => {
  const [activeFilter, setActiveFilter] = useState<BusinessFlow | typeof ALL_FLOWS>(ALL_FLOWS);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending'});
  
  const filteredClients = useMemo(() => {
    let sortableClients = [...clients];
    if (sortConfig !== null) {
        sortableClients.sort((a, b) => {
            const aValue = a[sortConfig.key as keyof Client];
            const bValue = b[sortConfig.key as keyof Client];

            if (aValue === undefined || aValue === null) return 1;
            if (bValue === undefined || bValue === null) return -1;
            
            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    }

    if (activeFilter === ALL_FLOWS) {
      return sortableClients;
    }
    return sortableClients.filter(client => client.flow === activeFilter);
  }, [clients, activeFilter, sortConfig]);

  const handleSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };


  return (
    <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-white">Directorio de Clientes</h2>
            <div className='flex items-center gap-4'>
                 <div className="flex flex-wrap gap-2">
                    {BUSINESS_FLOWS.map(flow => (
                    <button
                        key={flow}
                        onClick={() => setActiveFilter(flow)}
                        className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                        activeFilter === flow
                            ? 'bg-primary-cyan-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        {flow}
                    </button>
                    ))}
                </div>
                 <div className="flex items-center bg-gray-800 rounded-lg p-1">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-primary-cyan-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                        <ViewGridIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-cyan-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                        <ViewListIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>

        {filteredClients.length === 0 ? (
             <div className="col-span-full p-8 text-center text-gray-500">No hay clientes en esta vista.</div>
        ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredClients.map(client => (
              <ClientCard 
                key={client.id}
                client={client}
                isSelected={false}
                onSelect={() => onClientSelect(client)}
              />
            ))}
            </div>
        ) : (
           <ClientsDataGrid clients={filteredClients} onClientSelect={(c) => onClientSelect(c)} onSort={handleSort} sortConfig={sortConfig}/>
        )}
    </div>
  );
};
