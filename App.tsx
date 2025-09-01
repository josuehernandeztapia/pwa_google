



import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { ToastContainer, toast } from './components/Shared/Toast';
import { Settings } from './components/Settings/Settings';
import { Client, Notification, Quote, NavigationContext, ViewMode, View } from './types/index';
import { simulationService } from './services/simulationService';
import { Cotizador } from './components/Simulator/Cotizador';
import { Ecosystems } from './components/Ecosystems/Ecosystems';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Opportunities } from './components/Opportunities/Opportunities';
import { ClientsView } from './components/Client/ClientsView';
import { ClientDetail } from './components/Client/ClientDetail';
import { CollectiveCredit } from './components/Tanda/CollectiveCredit';
import { BottomNavBar } from './components/Layout/BottomNavBar';
import { SimulatorLanding } from './components/Simulator/SimulatorLanding';
import { useServiceWorker } from './hooks/useServiceWorker';
import { useIndexedDB } from './hooks/useIndexedDB';
import { useOdoo } from './hooks/useOdoo';
import { getDataSyncService } from './services/sync/dataSyncService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [simulatingClient, setSimulatingClient] = useState<Client | null>(null);
  const [simulationMode, setSimulationMode] = useState<'acquisition' | 'savings'>('acquisition');
  const [sidebarAlerts, setSidebarAlerts] = useState<{ [key in View]?: number }>({});
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isOpportunityModalOpen, setIsOpportunityModalOpen] = useState(false);
  const [navigationContext, setNavigationContext] = useState<NavigationContext | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('advisor');
  
  // Enterprise Hooks
  useServiceWorker();
  const { isReady: isDbReady, dbService, cacheClients, getCachedClients } = useIndexedDB();
  const { isAuthenticated, odooService } = useOdoo();

  useEffect(() => {
    if (isDbReady && isAuthenticated) {
      const syncService = getDataSyncService(dbService, odooService);
      // Listen for messages from the service worker to trigger a sync
      navigator.serviceWorker?.addEventListener('message', event => {
        if (event.data && event.data.type === 'TRIGGER_SYNC') {
            console.log('Sync triggered by service worker message.');
            syncService.processSyncQueue();
        }
      });
    }
  }, [isDbReady, isAuthenticated, dbService, odooService]);

  const calculateSidebarAlerts = useCallback(async (currentClients: Client[]) => {
    if (currentClients.length > 0) {
        const counts = await simulationService.getSidebarAlertCounts(currentClients);
        setSidebarAlerts(counts);
    }
  }, []);

  const fetchClients = useCallback(async (clientIdToSelect?: string) => {
    setIsLoading(true);
    try {
      let data: Client[] = [];
      if (navigator.onLine && isAuthenticated) {
        console.log("Fetching clients from Odoo...");
        const realClients = await odooService.getClients();
        if (realClients && realClients.length > 0) {
          data = realClients; // Assume mapping logic is in getClients
          await cacheClients(data);
        } else {
           throw new Error("Odoo returned no clients, falling back to mock data.");
        }
      } else {
        console.log("Offline or not authenticated. Fetching clients from IndexedDB cache...");
        const cachedData = await getCachedClients();
        if (cachedData.length > 0) {
            data = cachedData;
        } else {
            throw new Error("No cached clients, falling back to mock data.");
        }
      }
      
      const processedData = data.map(client => ({
        ...client,
        events: client.events.map(event => ({ ...event, timestamp: new Date(event.timestamp as any) })),
      }));
      setClients(processedData);
      calculateSidebarAlerts(processedData);

      if (clientIdToSelect) {
          const clientToSelect = processedData.find(c => c.id === clientIdToSelect);
          setSelectedClient(clientToSelect || null);
      }

    } catch (error) {
      console.warn("Fallback: Fetching clients from simulation service.", error);
      const rawData = await simulationService.getClients();
      const data = rawData.map(client => ({...client, events: client.events.map(event => ({ ...event, timestamp: new Date(event.timestamp as any)}))}));
      setClients(data);
      calculateSidebarAlerts(data);
      await cacheClients(data); // Cache the mock data for offline use
    } finally {
      setIsLoading(false);
    }
  }, [calculateSidebarAlerts, isAuthenticated, odooService, cacheClients, getCachedClients]);

  useEffect(() => {
    if(isAuthenticated && isDbReady) {
        fetchClients();
    }
  }, [fetchClients, isAuthenticated, isDbReady]);
  
  useEffect(() => {
    const intervalId = setInterval(async () => {
        try {
            const newAlert = await simulationService.getSimulatedAlert(clients);
            if (newAlert) {
                const newNotificationWithDate = { ...newAlert, timestamp: new Date(newAlert.timestamp) };
                setNotifications(prev => [newNotificationWithDate, ...prev]);
                setUnreadCount(prev => prev + 1);
            }
        } catch (error) {
            console.error("Failed to fetch simulated alert:", error);
        }
    }, 8000);
    return () => clearInterval(intervalId);
  }, [clients]);

  const handleClientUpdate = useCallback((updatedClient: Client) => {
    const sanitizedClient = {
        ...updatedClient,
        events: updatedClient.events.map(e => ({...e, timestamp: new Date(e.timestamp as any)}))
    };
    const updatedClients = clients.map(c => c.id === sanitizedClient.id ? sanitizedClient : c);
    setClients(updatedClients);
    setSelectedClient(sanitizedClient);
    calculateSidebarAlerts(updatedClients);
    // Queue for sync
    const syncService = getDataSyncService(dbService, odooService);
    syncService.queueOperation({ type: 'UPDATE', entity: 'client', data: sanitizedClient, retries: 0, timestamp: new Date() });
  }, [clients, calculateSidebarAlerts, dbService, odooService]);
  
  const handleClientCreated = useCallback(async (newClient: Client, mode: 'acquisition' | 'savings') => {
    try {
        await odooService.createOpportunity({ name: newClient.name, partner_name: newClient.name });
        const newClients = [...clients, newClient];
        setClients(newClients);
        setSimulatingClient(newClient);
        setSimulationMode(mode);
        setActiveView('simulador');
        setSelectedClient(null);
        calculateSidebarAlerts(newClients);
        
        // Queue for sync if offline
        const syncService = getDataSyncService(dbService, odooService);
        syncService.queueOperation({ type: 'CREATE', entity: 'client', data: newClient, retries: 0, timestamp: new Date() });
    } catch(err) {
        toast.error("Error creating opportunity in Odoo.");
    }
  }, [clients, calculateSidebarAlerts, odooService, dbService]);

  const handleFormalize = useCallback(async (quote: Quote) => {
    if (!simulatingClient) return;
    toast.info(`Formalizando plan para ${simulatingClient.name}...`);
    try {
        const updatedClient = await simulationService.saveQuoteToClient(simulatingClient.id, quote);
        setSimulatingClient(null);
        await fetchClients(updatedClient.id);
        toast.success("Plan formalizado. Procediendo al expediente.");
    } catch (e) {
        toast.error("Error al formalizar el plan.");
    }
  }, [simulatingClient, fetchClients]);

  const handleGenericFormalize = useCallback(() => {
    toast.info('Para formalizar un plan, por favor, inicia desde el botón "+ Nueva Oportunidad".');
  }, []);

  const handleNotificationAction = useCallback((notification: Notification) => {
    if (notification.clientId) {
      const client = clients.find(c => c.id === notification.clientId);
      if (client) {
        setSelectedClient(client);
        setSimulatingClient(null);
        setActiveView('dashboard');
      }
    }
  }, [clients]);

  const handleMarkAsRead = useCallback(() => setUnreadCount(0), []);

  const handleSelectClient = (client: Client | null, context?: NavigationContext) => {
      setSimulatingClient(null); // Explicitly clear simulation context
      setSelectedClient(client);
      setNavigationContext(context || null);
  };

  const handleViewChange = (view: View) => {
    setSelectedClient(null);
    setSimulatingClient(null);
    setNavigationContext(null);
    setActiveView(view);
  };
  
  const handleBackFromDetail = () => {
    setSelectedClient(null);
    setNavigationContext(null);
  };

  const renderContent = () => {
    if (simulatingClient) {
        return <Cotizador client={simulatingClient} onFormalize={handleFormalize} initialMode={simulationMode} viewMode={viewMode} />;
    }
    if (selectedClient) {
        return <ClientDetail client={selectedClient} onClientUpdate={handleClientUpdate} onBack={handleBackFromDetail} navigationContext={navigationContext} viewMode={viewMode} />;
    }

    switch(activeView) {
      case 'dashboard':
        return <Dashboard onClientSelect={handleSelectClient} />;
      case 'simulador':
        return <SimulatorLanding onNewOpportunity={() => setIsOpportunityModalOpen(true)} />;
      case 'oportunidades':
        return <Opportunities onClientSelect={handleSelectClient} />;
      case 'ecosistemas':
        return <Ecosystems clients={clients} onClientSelect={handleSelectClient} />;
      case 'clientes':
        return <ClientsView clients={clients} onClientSelect={handleSelectClient} />;
      case 'grupos-colectivos':
        return <CollectiveCredit />;
      case 'configuracion':
        return <Settings />;
      default:
        return <Dashboard onClientSelect={handleSelectClient} />;
    }
  }

  return (
    <>
      <ToastContainer />
      <div className="flex h-screen bg-gray-950 text-gray-200 font-sans">
        <Sidebar 
          activeView={activeView} 
          onViewChange={handleViewChange} 
          alertCounts={sidebarAlerts} 
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            onClientCreated={handleClientCreated}
            notifications={notifications}
            unreadCount={unreadCount}
            // FIX: Corrected typo, was passing undefined variable `onNotificationAction` instead of the handler `handleNotificationAction`.
            onNotificationAction={handleNotificationAction}
            onMarkAsRead={handleMarkAsRead}
            isOpportunityModalOpen={isOpportunityModalOpen}
            setIsOpportunityModalOpen={setIsOpportunityModalOpen}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-4 md:p-8">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-cyan-400"></div>
              </div>
            ) : renderContent()}
          </main>
          <BottomNavBar activeView={activeView} onViewChange={handleViewChange} alertCounts={sidebarAlerts} />
        </div>
      </div>
    </>
  );
};

export default App;