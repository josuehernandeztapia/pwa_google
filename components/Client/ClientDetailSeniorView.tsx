import React from 'react';
import { Client, DocumentStatus, EventLog, Actor, NavigationContext } from '../../types/index';
import { Breadcrumb } from '../Shared/Breadcrumb';
import { ChartBarIcon, DocumentTextIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '../Shared/Icon';

interface ClientDetailSeniorViewProps {
  client: Client;
  onBack: () => void;
  navigationContext: NavigationContext | null;
}

const SeniorInfoCard: React.FC<{title: string; children: React.ReactNode; icon: React.ReactNode}> = ({ title, children, icon }) => (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
            <div className="text-primary-cyan-400">{icon}</div>
            <h3 className="text-2xl font-bold text-white">{title}</h3>
        </div>
        {children}
    </div>
);

const SeniorProgressBar: React.FC<{ progress: number; goal: number; currency: string }> = ({ progress, goal, currency }) => {
  const percentage = goal > 0 ? Math.min((progress / goal) * 100, 100) : 0;
  const formattedProgress = new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(progress);
  const formattedGoal = new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(goal);

  return (
    <div>
      <div className="w-full bg-gray-700 rounded-full h-4">
        <div className="bg-primary-cyan-500 h-4 rounded-full transition-all duration-500 ease-out" style={{ width: `${percentage}%` }}></div>
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-lg font-medium text-gray-300">{formattedProgress}</span>
        <span className="text-base font-medium text-gray-400">de {formattedGoal}</span>
      </div>
    </div>
  );
};

const SeniorEventLogItem: React.FC<{ event: EventLog }> = ({ event }) => {
    const friendlyMessage = (msg: string) => {
        if (msg.toLowerCase().includes('aportación voluntaria')) return 'Hiciste un pago.';
        if (msg.toLowerCase().includes('recaudación flota')) return 'Se sumó dinero del combustible.';
        if (msg.toLowerCase().includes('plan de venta')) return 'Iniciamos tu plan.';
        if (msg.toLowerCase().includes('documento')) return 'Subiste un documento.';
        return 'Movimiento en tu cuenta.';
    };

    return (
        <div className="flex items-center space-x-4 py-3">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-700 rounded-full">
                <ClockIcon className="w-5 h-5 text-gray-400"/>
            </div>
            <div className="flex-1">
                <p className="text-lg text-gray-200">{friendlyMessage(event.message)}</p>
                <p className="text-base text-gray-500">{event.timestamp.toLocaleDateString('es-MX', {day: 'numeric', month: 'long'})}</p>
            </div>
        </div>
    );
};


export const ClientDetailSeniorView: React.FC<ClientDetailSeniorViewProps> = ({ client, onBack, navigationContext }) => {
    const nextPendingDocument = client.documents.find(d => d.status === DocumentStatus.Pendiente);
    const simplifiedEvents = client.events.slice(0, 3);
    
    return (
        <div>
             {navigationContext ? (
                <Breadcrumb context={navigationContext} client={client} onNavigate={() => onBack()} />
                ) : (
                <button onClick={onBack} className="mb-4 text-sm text-gray-400 hover:text-white px-3 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors">
                    &larr; Volver
                </button>
            )}
            <div className="flex items-center mb-8">
                <img src={client.avatarUrl} alt={client.name} className="w-20 h-20 rounded-full object-cover" />
                <div className="ml-5">
                    <h2 className="text-4xl font-bold text-white">{client.name}</h2>
                    <p className="text-xl text-gray-400 mt-1">{client.status}</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto space-y-8">
                {client.paymentPlan && (
                     <SeniorInfoCard title="Tu Próximo Pago" icon={<ChartBarIcon className="w-8 h-8"/>}>
                        <p className="text-xl text-gray-300 mb-4">Así va tu pago de este mes:</p>
                        <SeniorProgressBar progress={client.paymentPlan.currentMonthProgress} goal={client.paymentPlan.monthlyGoal} currency={client.paymentPlan.currency} />
                        <button className="mt-6 w-full text-center py-4 text-xl font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">
                            Pagar Ahora
                        </button>
                    </SeniorInfoCard>
                )}

                 {client.savingsPlan && (
                     <SeniorInfoCard title="Así va tu Ahorro" icon={<ChartBarIcon className="w-8 h-8"/>}>
                        <p className="text-xl text-gray-300 mb-4">Estás ahorrando para un enganche de {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(client.savingsPlan.goal)}.</p>
                        <SeniorProgressBar progress={client.savingsPlan.progress} goal={client.savingsPlan.goal} currency={client.savingsPlan.currency} />
                         <button className="mt-6 w-full text-center py-4 text-xl font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">
                            Hacer una Aportación
                        </button>
                    </SeniorInfoCard>
                )}

                <SeniorInfoCard title="Tus Documentos" icon={<DocumentTextIcon className="w-8 h-8"/>}>
                    {nextPendingDocument ? (
                        <div>
                            <p className="text-xl text-gray-300 mb-4">El siguiente documento que necesitamos es:</p>
                            <div className="flex items-center p-4 bg-gray-900 rounded-lg">
                                <XCircleIcon className="w-8 h-8 text-amber-400 mr-4"/>
                                <span className="text-2xl font-semibold text-white">{nextPendingDocument.name}</span>
                            </div>
                        </div>
                    ) : (
                         <div className="flex items-center p-4 bg-gray-900 rounded-lg">
                            <CheckCircleIcon className="w-8 h-8 text-emerald-400 mr-4"/>
                            <span className="text-2xl font-semibold text-white">¡Tu expediente está completo!</span>
                        </div>
                    )}
                </SeniorInfoCard>

                <SeniorInfoCard title="Últimos Movimientos" icon={<ClockIcon className="w-8 h-8"/>}>
                    <div className="divide-y divide-gray-700">
                        {simplifiedEvents.map(event => <SeniorEventLogItem key={event.id} event={event} />)}
                    </div>
                </SeniorInfoCard>
            </div>
        </div>
    );
};