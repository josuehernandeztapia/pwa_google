

import React, { useState } from 'react';
import { Integrations } from './Integrations';
import { UserCircleIcon, ChipIcon } from '../Shared/Icon';

type SettingsTab = 'profile' | 'integrations';

const ProfileSettings: React.FC = () => (
    <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 max-w-lg mx-auto">
        <div className="flex flex-col items-center">
            <img className="h-24 w-24 rounded-full object-cover mb-4" src="https://picsum.photos/seed/advisor/100/100" alt="Avatar del Asesor" />
            <h3 className="text-2xl font-bold text-white">Ricardo Montoya</h3>
            <p className="text-md text-gray-400">Asesor Senior</p>
            <div className="mt-6 w-full space-y-4">
                <button className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-500">
                    Editar Perfil
                </button>
                 <button className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600/50 border border-red-500/50 rounded-lg hover:bg-red-600/70">
                    Cerrar Sesión
                </button>
            </div>
        </div>
    </div>
);

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'integrations':
        return <Integrations />;
      default:
        return null;
    }
  };

  return (
    <div>
        <h2 className="text-2xl font-bold text-white mb-6">Configuración y Estado del Sistema</h2>
        <div className="border-b border-gray-700 mb-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button 
                    onClick={() => setActiveTab('profile')} 
                    className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'profile' ? 'border-primary-cyan-500 text-primary-cyan-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}
                >
                    <UserCircleIcon className="w-5 h-5"/>
                    Perfil y Cuenta
                </button>
                <button 
                    onClick={() => setActiveTab('integrations')} 
                    className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'integrations' ? 'border-primary-cyan-500 text-primary-cyan-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}
                >
                    <ChipIcon className="w-5 h-5"/>
                    Estado de Integraciones
                </button>
            </nav>
        </div>
        <div>
            {renderContent()}
        </div>
    </div>
  );
};
