

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Ecosystem, Client, DocumentStatus, CollectiveCreditGroup, NavigationContext } from '../types';
import { simulationService } from '../services/simulationService';
import { LibraryIcon, PlusCircleIcon, UserGroupIcon } from './icons';
import { Modal } from './Modal';
import { toast } from './Toast';
import { Breadcrumb } from './Breadcrumb';
import { ClientCard } from './ClientCard';

const EcosystemSummaryCard: React.FC<{ ecosystem: Ecosystem, groupCount: number, memberCount: number }> = ({ ecosystem, groupCount, memberCount }) => {
    const docsCompleted = ecosystem.documents.filter(d => d.status === DocumentStatus.Aprobado).length;
    const totalDocs = ecosystem.documents.length;
    const progress = totalDocs > 0 ? (docsCompleted / totalDocs) * 100 : 0;
    
    return (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
            <div className="flex justify-between items-start">
                <h3 className="text-2xl font-bold text-white">{ecosystem.name}</h3>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${ecosystem.status === 'Activo' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>{ecosystem.status}</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">Ecosistema de Ruta para Colateral Social.</p>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div>
                    <span className="text-xs text-gray-400 block">Grupos Vinculados</span>
                    <span className="text-xl font-bold text-white">{groupCount}</span>
                </div>
                <div>
                    <span className="text-xs text-gray-400 block">Miembros Totales</span>
                    <span className="text-xl font-bold text-white">{memberCount}</span>
                </div>
                 <div className="md:col-span-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                       <span>Progreso del Expediente de Ruta</span>
                       <span>{docsCompleted} / {totalDocs}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-primary-cyan-500 h-2 rounded-full" style={{width: `${progress}%`}}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const GroupSummaryCard: React.FC<{ group: CollectiveCreditGroup }> = ({ group }) => (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
        <h3 className="text-2xl font-bold text-white">{group.name}</h3>
        <p className="text-sm text-gray-400 mt-2">Detalles del Grupo Colectivo.</p>
         <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
             <div>
                <span className="text-xs text-gray-400 block">Miembros</span>
                <span className="text-xl font-bold text-white">{group.members.length} / {group.capacity}</span>
            </div>
            <div>
                <span className="text-xs text-gray-400 block">Unidades Entregadas</span>
                <span className="text-xl font-bold text-white">{group.unitsDelivered} / {group.totalUnits}</span>
            </div>
        </div>
    </div>
);

export const Ecosystems: React.FC<{ clients: Client[], onClientSelect: (client: Client, context: NavigationContext) => void }> = ({ clients, onClientSelect }) => {
    const [viewLevel, setViewLevel] = useState<'list' | 'ecosystem' | 'group'>('list');
    const [selectedEcosystem, setSelectedEcosystem] = useState<Ecosystem | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<CollectiveCreditGroup | null>(null);
    const [activeTab, setActiveTab] = useState<'groups' | 'members'>('groups');

    const [allEcosystems, setAllEcosystems] = useState<Ecosystem[]>([]);
    const [allGroups, setAllGroups] = useState<CollectiveCreditGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [ecosystemsData, groupsData] = await Promise.all([
                    simulationService.getEcosystems(),
                    simulationService.getCollectiveCreditGroups()
                ]);
                setAllEcosystems(ecosystemsData);
                setAllGroups(groupsData);
            } catch (error) {
                toast.error("No se pudieron cargar los datos.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Reset tab when leaving ecosystem view for a better user experience
    useEffect(() => {
        if (viewLevel !== 'ecosystem') {
            setActiveTab('groups');
        }
    }, [viewLevel]);

    const { groupsByEcosystemId, clientsByEcosystemId, clientsByGroupId, ecosystemStats } = useMemo(() => {
        const groupsByEco = new Map<string, CollectiveCreditGroup[]>();
        const clientsByEco = new Map<string, Client[]>();
        const clientsByGroup = new Map<string, Client[]>();
        const ecoStats = new Map<string, { memberCount: number }>();

        clients.forEach(client => {
            if (client.ecosystemId) {
                if (!clientsByEco.has(client.ecosystemId)) clientsByEco.set(client.ecosystemId, []);
                clientsByEco.get(client.ecosystemId)!.push(client);
                
                const currentStats = ecoStats.get(client.ecosystemId) || { memberCount: 0 };
                currentStats.memberCount++;
                ecoStats.set(client.ecosystemId, currentStats);
            }
            if (client.collectiveCreditGroupId) {
                 if (!clientsByGroup.has(client.collectiveCreditGroupId)) clientsByGroup.set(client.collectiveCreditGroupId, []);
                clientsByGroup.get(client.collectiveCreditGroupId)!.push(client);
            }
        });

        allGroups.forEach(group => {
            const firstMember = group.members.length > 0 ? clients.find(c => c.id === group.members[0].clientId) : null;
            if(firstMember && firstMember.ecosystemId) {
                if (!groupsByEco.has(firstMember.ecosystemId)) groupsByEco.set(firstMember.ecosystemId, []);
                groupsByEco.get(firstMember.ecosystemId)!.push(group);
            }
        });

        return { 
            groupsByEcosystemId: groupsByEco, 
            clientsByEcosystemId: clientsByEco,
            clientsByGroupId: clientsByGroup,
            ecosystemStats: ecoStats
        };
    }, [clients, allGroups]);

    const handleSelectEcosystem = useCallback((ecosystem: Ecosystem) => {
        setSelectedEcosystem(ecosystem);
        setViewLevel('ecosystem');
    }, []);

    const handleSelectGroup = useCallback((group: CollectiveCreditGroup) => {
        setSelectedGroup(group);
        setViewLevel('group');
    }, []);

    const handleBack = useCallback((level: 'root' | 'ecosystem') => {
        if (level === 'root') {
            setViewLevel('list');
            setSelectedEcosystem(null);
            setSelectedGroup(null);
        } else if (level === 'ecosystem') {
            setViewLevel('ecosystem');
            setSelectedGroup(null);
        }
    }, []);
    
    const renderListView = () => (
        <>
            <h2 className="text-2xl font-bold text-white mb-6">Gestión de Ecosistemas (Rutas)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {allEcosystems.map(eco => (
                    <button key={eco.id} onClick={() => handleSelectEcosystem(eco)} className="text-left">
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 h-full flex flex-col transition-transform hover:scale-[1.02] hover:border-primary-cyan-700">
                            <h3 className="text-xl font-bold text-white">{eco.name}</h3>
                            <p className="text-sm text-gray-400 mt-2 flex-1">{eco.status}</p>
                            <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between text-sm">
                                <span className="text-gray-400">Miembros</span>
                                <span className="font-semibold text-white">{ecosystemStats.get(eco.id)?.memberCount || 0}</span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </>
    );

    const renderEcosystemView = () => {
        if (!selectedEcosystem) return null;
        const groups = groupsByEcosystemId.get(selectedEcosystem.id) || [];
        const members = clientsByEcosystemId.get(selectedEcosystem.id) || [];
        
        return (
            <div>
                <Breadcrumb context={{ ecosystem: selectedEcosystem }} onNavigate={handleBack} />
                <EcosystemSummaryCard ecosystem={selectedEcosystem} groupCount={groups.length} memberCount={members.length} />
                 <div className="border-b border-gray-700 mb-4">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button onClick={() => setActiveTab('groups')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'groups' ? 'border-primary-cyan-500 text-primary-cyan-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                            Grupos Colectivos ({groups.length})
                        </button>
                        <button onClick={() => setActiveTab('members')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'members' ? 'border-primary-cyan-500 text-primary-cyan-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                            Miembros Individuales ({members.length})
                        </button>
                    </nav>
                </div>
                {activeTab === 'groups' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {groups.map(group => (
                             <button key={group.id} onClick={() => handleSelectGroup(group)} className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-left transition-colors hover:border-primary-cyan-700">
                                <h4 className="font-bold text-white">{group.name}</h4>
                                <p className="text-xs text-gray-400">{group.members.length} / {group.capacity} miembros</p>
                            </button>
                        ))}
                    </div>
                )}
                {activeTab === 'members' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {members.map(client => <ClientCard key={client.id} client={client} isSelected={false} onSelect={() => onClientSelect(client, { ecosystem: selectedEcosystem })} showContextTags={false} />)}
                    </div>
                )}
            </div>
        );
    };

    const renderGroupView = () => {
        if (!selectedEcosystem || !selectedGroup) return null;
        const members = clientsByGroupId.get(selectedGroup.id) || [];
        return (
            <div>
                <Breadcrumb context={{ ecosystem: selectedEcosystem, group: selectedGroup }} onNavigate={handleBack} />
                <GroupSummaryCard group={selectedGroup} />
                 <h4 className="text-xl font-bold text-white mb-4">Miembros del Grupo</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {members.map(client => <ClientCard key={client.id} client={client} isSelected={false} onSelect={() => onClientSelect(client, { ecosystem: selectedEcosystem, group: selectedGroup })} showContextTags={false}/>)}
                </div>
            </div>
        );
    };
    
    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-cyan-400"></div></div>;
    }

    if (viewLevel === 'list') return renderListView();
    if (viewLevel === 'ecosystem') return renderEcosystemView();
    if (viewLevel === 'group') return renderGroupView();

    return null;
};