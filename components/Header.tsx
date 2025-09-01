

import React, { useState, useEffect } from 'react';
import { PlusCircleIcon, BellIcon, CheckCircleIcon, LightBulbIcon, UserCircleIcon, TruckIcon } from './icons';
import { Modal } from './Modal';
import { toast } from './Toast';
import { simulationService } from '../services/simulationService';
import { Notification, Ecosystem, Client, BusinessFlow, ViewMode } from '../types';
import { NotificationsPanel } from './NotificationsPanel';

type OnboardingStep = 'flow_selection' | 'market' | 'clientType' | 'ecosystem' | 'details';
type FlowSelection = 'contado' | 'financiero' | 'ahorro';
type Market = 'aguascalientes' | 'edomex';
type ClientType = 'individual' | 'colectivo';

interface HeaderProps {
    onClientCreated: (client: Client, mode: 'acquisition' | 'savings') => void;
    notifications: Notification[];
    unreadCount: number;
    onNotificationAction: (notification: Notification) => void;
    onMarkAsRead: () => void;
    isOpportunityModalOpen: boolean;
    setIsOpportunityModalOpen: (isOpen: boolean) => void;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
}

const OnboardingWizard: React.FC<{ onClientCreated: (client: Client, mode: 'acquisition' | 'savings') => void, onClose: () => void }> = ({ onClientCreated, onClose }) => {
    const [step, setStep] = useState<OnboardingStep>('flow_selection');
    const [flowSelection, setFlowSelection] = useState<FlowSelection | null>(null);
    const [market, setMarket] = useState<Market | null>(null);
    const [clientType, setClientType] = useState<ClientType | null>(null);
    const [ecosystems, setEcosystems] = useState<Ecosystem[]>([]);
    const [selectedEcosystem, setSelectedEcosystem] = useState<string | null>(null);
    const [clientName, setClientName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        if (step === 'ecosystem') {
            const fetchEcosystems = async () => {
                const data = await simulationService.getEcosystems();
                setEcosystems(data);
            };
            fetchEcosystems();
        }
    }, [step]);

    const handleFlowSelect = (selection: FlowSelection) => {
        setFlowSelection(selection);
        if (selection === 'ahorro') {
            // Ahorro/Colectivo is exclusive to EdoMex as per the blueprint
            setMarket('edomex');
            setStep('clientType');
        } else {
            setStep('market');
        }
    };
    
    const handleSelectMarket = (selectedMarket: Market) => {
        setMarket(selectedMarket);
        if (selectedMarket === 'edomex' && flowSelection !== 'ahorro') {
             setStep('ecosystem');
        } else {
            setStep('details');
        }
    };

    const handleSelectClientType = (type: ClientType) => {
        setClientType(type);
        // All savings plans in EdoMex (individual or collective) require an ecosystem link
        setStep('ecosystem');
    };

    const handleCreateClient = async () => {
        if (!flowSelection || !market || !clientName) {
            toast.error("Por favor, completa todos los campos.");
            return;
        }
        setIsLoading(true);
        try {
            let newClient: Client;
            if (flowSelection === 'ahorro') {
                newClient = await simulationService.createSavingsOpportunity({
                    name: clientName,
                    market: market,
                    clientType: clientType!,
                    ecosystemId: selectedEcosystem || undefined,
                });
                onClientCreated(newClient, 'savings');
            } else { // contado or financiero
                newClient = await simulationService.createClientFromOnboarding({
                    name: clientName,
                    market: market,
                    saleType: flowSelection,
                    ecosystemId: selectedEcosystem || undefined,
                });
                onClientCreated(newClient, 'acquisition');
            }
            toast.success(`Oportunidad "${newClient.name}" creada. Modelando solución...`);
            onClose();
        } catch (error) {
            toast.error("Error al crear la oportunidad.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 'flow_selection':
                return (
                    <>
                        <p className="text-gray-400 mb-4">¿Qué necesita tu cliente?</p>
                        <button onClick={() => handleFlowSelect('contado')} className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors mb-2">
                             <div className="flex items-start">
                                <CheckCircleIcon className="w-6 h-6 text-indigo-400 mr-3 mt-1"/>
                                <div>
                                    <p className="font-semibold text-white">Compra de Contado</p>
                                    <p className="text-sm text-gray-400">El "carril express" para clientes que liquidan con recursos propios.</p>
                                </div>
                            </div>
                        </button>
                        <button onClick={() => handleFlowSelect('financiero')} className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors mb-2">
                             <div className="flex items-start">
                                <CheckCircleIcon className="w-6 h-6 text-primary-cyan-400 mr-3 mt-1"/>
                                <div>
                                    <p className="font-semibold text-white">Venta a Plazo</p>
                                    <p className="text-sm text-gray-400">Para clientes que requieren un plan de financiamiento.</p>
                                </div>
                            </div>
                        </button>
                        <button onClick={() => handleFlowSelect('ahorro')} className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                             <div className="flex items-start">
                                <LightBulbIcon className="w-6 h-6 text-amber-300 mr-3 mt-1"/>
                                <div>
                                    <p className="font-semibold text-white">Plan de Ahorro / Crédito Colectivo</p>
                                    <p className="text-sm text-gray-400">Para clientes que necesitan planificar o unirse a una Tanda.</p>
                                </div>
                            </div>
                        </button>
                    </>
                );
            case 'market':
                return (
                    <>
                        <p className="text-gray-400 mb-4">¿En qué mercado se realiza la operación?</p>
                        <button onClick={() => handleSelectMarket('aguascalientes')} className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors mb-2">
                            <p className="font-semibold text-white">Aguascalientes</p>
                            <p className="text-sm text-gray-400">Flujo de Venta Individual.</p>
                        </button>
                        <button onClick={() => handleSelectMarket('edomex')} className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                            <p className="font-semibold text-white">Estado de México</p>
                            <p className="text-sm text-gray-400">Flujo de Ecosistema de Ruta (Colateral Social).</p>
                        </button>
                    </>
                );
            case 'clientType':
                return (
                     <>
                        <p className="text-gray-400 mb-4">¿Este plan de ahorro es para un individuo o para un grupo?</p>
                        <button onClick={() => handleSelectClientType('individual')} className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors mb-2">
                            <p className="font-semibold text-white">Ahorro Individual</p>
                            <p className="text-sm text-gray-400">Un plan de ahorro personal para alcanzar un enganche.</p>
                        </button>
                        <button onClick={() => handleSelectClientType('colectivo')} className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                            <p className="font-semibold text-white">Ahorro para Crédito Colectivo (Tanda)</p>
                            <p className="text-sm text-gray-400">El cliente se unirá a un grupo para ahorrar en conjunto.</p>
                        </button>
                    </>
                );
            case 'ecosystem':
                return (
                     <>
                        <p className="text-gray-400 mb-4">Este mercado opera con un modelo de Ecosistema. Por favor, vincula al cliente con su ruta.</p>
                         <label htmlFor="ecosystem" className="block text-sm font-medium text-gray-300">Ecosistema (Ruta)</label>
                        <select id="ecosystem" value={selectedEcosystem || ''} onChange={(e) => setSelectedEcosystem(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-900 border-gray-600 focus:outline-none focus:ring-primary-cyan-500 focus:border-primary-cyan-500 sm:text-sm rounded-md">
                            <option value="">-- Selecciona una ruta --</option>
                            {ecosystems.map(eco => <option key={eco.id} value={eco.id}>{eco.name}</option>)}
                        </select>
                        <p className="text-xs text-gray-500 mt-2">Si la ruta no existe, puedes crearla en la sección de "Ecosistemas".</p>
                        <button onClick={() => setStep('details')} disabled={!selectedEcosystem} className="w-full mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-cyan-600 rounded-lg hover:bg-primary-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed">Continuar</button>
                    </>
                );
            case 'details':
                 return (
                    <>
                        <p className="text-gray-400 mb-4">Introduce el nombre del prospecto para crear la oportunidad.</p>
                        <label htmlFor="clientName" className="block text-sm font-medium text-gray-300">Nombre Completo del Prospecto</label>
                        <input type="text" id="clientName" value={clientName} onChange={e => setClientName(e.target.value)} required className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white" placeholder="Ej. Juan Pérez"/>
                        <button onClick={handleCreateClient} disabled={!clientName || isLoading} className="w-full mt-4 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? 'Creando...' : 'Crear Oportunidad y Simular'}
                        </button>
                    </>
                 );
        }
    }
    
    return <div className="space-y-4">{renderStep()}</div>
}

const ViewModeToggle: React.FC<{ viewMode: ViewMode, onViewModeChange: (mode: ViewMode) => void }> = ({ viewMode, onViewModeChange }) => (
    <div className="flex items-center bg-gray-900 rounded-full p-1 border border-gray-700">
        <button
            onClick={() => onViewModeChange('advisor')}
            className={`p-2 rounded-full transition-colors ${viewMode === 'advisor' ? 'bg-primary-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}
            title="Vista Asesor"
        >
            <UserCircleIcon className="w-6 h-6" />
        </button>
        <button
            onClick={() => onViewModeChange('client')}
            className={`p-2 rounded-full transition-colors ${viewMode === 'client' ? 'bg-primary-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}
            title="Vista Cliente/Operador"
        >
            <TruckIcon className="w-6 h-6" />
        </button>
    </div>
);


export const Header: React.FC<HeaderProps> = ({ onClientCreated, notifications, unreadCount, onNotificationAction, onMarkAsRead, isOpportunityModalOpen, setIsOpportunityModalOpen, viewMode, onViewModeChange }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const handleToggleNotifications = () => {
    setIsNotificationsOpen(prev => !prev);
    if (!isNotificationsOpen) {
        onMarkAsRead();
    }
  };

  return (
    <>
      <header className="flex items-center justify-between h-20 px-4 md:px-8 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div>
          <h1 className="text-xl font-semibold text-white">Centro de Comando</h1>
          <p className="text-sm text-gray-400">Visión 360° de tus clientes y operaciones.</p>
        </div>
        <div className="flex items-center space-x-4">
          <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
          <button 
            onClick={() => setIsOpportunityModalOpen(true)}
            className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary-cyan-600 rounded-lg hover:bg-primary-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-primary-cyan-500 transition-colors"
          >
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            Nueva Oportunidad
          </button>
          
          <div className="relative">
             <button onClick={handleToggleNotifications} className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                <BellIcon className="w-6 h-6"/>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-gray-800">
                        {unreadCount}
                    </span>
                )}
             </button>
             {isNotificationsOpen && (
                <NotificationsPanel 
                    notifications={notifications}
                    onNotificationAction={onNotificationAction}
                    onClose={() => setIsNotificationsOpen(false)}
                />
             )}
          </div>

          <div className="flex items-center">
              <img className="h-10 w-10 rounded-full object-cover" src="https://picsum.photos/seed/advisor/100/100" alt="Avatar del Asesor" />
              <div className="ml-3 hidden md:block">
                  <p className="text-sm font-medium text-white">Ricardo Montoya</p>
                  <p className="text-xs text-gray-400">Asesor Senior</p>
              </div>
          </div>
        </div>
      </header>
      
      <Modal isOpen={isOpportunityModalOpen} onClose={() => setIsOpportunityModalOpen(false)} title="Asistente de Creación de Oportunidad">
          <OnboardingWizard onClientCreated={onClientCreated} onClose={() => setIsOpportunityModalOpen(false)} />
      </Modal>
    </>
  );
};