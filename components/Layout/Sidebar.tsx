



import React from 'react';
import { UserGroupIcon, CogIcon, ChartBarIcon, LibraryIcon, DashboardIcon, CalculatorIcon, ChevronDoubleLeftIcon } from '../Shared/Icon';
import { Logo } from '../Shared/Logo';
import { View } from '../../types/index';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  alertCounts: { [key in View]?: number };
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

const NavLink: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick: () => void; alertCount?: number; isCollapsed: boolean; }> = ({ icon, label, active, onClick, alertCount, isCollapsed }) => (
  <a
    href="#"
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={`relative flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 group ${
      active
        ? 'bg-primary-cyan-800 text-white'
        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
    }`}
    title={isCollapsed ? label : undefined}
  >
    {icon}
    <span className={`ml-3 flex-1 transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>{label}</span>
     {alertCount && alertCount > 0 && (
      <span className={`flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white transition-opacity duration-200 ${isCollapsed ? 'absolute -top-1 -right-1' : ''}`}>
        {isCollapsed ? alertCount : <span>{alertCount}</span>}
      </span>
    )}
    {isCollapsed && (
        <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:block bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded-md whitespace-nowrap">
            {label}
        </span>
    )}
  </a>
);

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, alertCounts, isCollapsed, setIsCollapsed }) => {
  return (
    <div className={`hidden md:flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex items-center justify-center h-20 border-b border-gray-800 px-4 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <Logo className={isCollapsed ? 'h-10' : 'h-16'}/>
      </div>
      <div className="flex-1 flex flex-col p-4 overflow-y-auto">
        <nav className="flex-1 space-y-2">
          <NavLink icon={<DashboardIcon className="w-6 h-6" />} label="Dashboard" active={activeView === 'dashboard'} onClick={() => onViewChange('dashboard')} isCollapsed={isCollapsed} />
          <NavLink icon={<ChartBarIcon className="w-6 h-6" />} label="Oportunidades" active={activeView === 'oportunidades'} onClick={() => onViewChange('oportunidades')} alertCount={alertCounts.oportunidades} isCollapsed={isCollapsed} />
          <NavLink icon={<LibraryIcon className="w-6 h-6" />} label="Ecosistemas (Rutas)" active={activeView === 'ecosistemas'} onClick={() => onViewChange('ecosistemas')} isCollapsed={isCollapsed} />
          <NavLink icon={<UserGroupIcon className="w-6 h-6" />} label="Clientes" active={activeView === 'clientes'} onClick={() => onViewChange('clientes')} alertCount={alertCounts.clientes} isCollapsed={isCollapsed} />
          
          <div className="pt-4 mt-4 border-t border-gray-700/50">
            <NavLink icon={<CalculatorIcon className="w-6 h-6" />} label="Simulador de Soluciones" active={activeView === 'simulador'} onClick={() => onViewChange('simulador')} isCollapsed={isCollapsed} />
            <NavLink icon={<UserGroupIcon className="w-6 h-6" />} label="Grupos Colectivos" active={activeView === 'grupos-colectivos'} onClick={() => onViewChange('grupos-colectivos')} isCollapsed={isCollapsed} />
          </div>

          <div className="pt-4 mt-4 border-t border-gray-700/50">
            <NavLink icon={<CogIcon className="w-6 h-6" />} label="Configuración" active={activeView === 'configuracion'} onClick={() => onViewChange('configuracion')} isCollapsed={isCollapsed} />
          </div>
        </nav>
        <div className="mt-auto">
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full flex items-center justify-center p-3 text-gray-400 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
                title={isCollapsed ? 'Expandir' : 'Colapsar'}
            >
                <ChevronDoubleLeftIcon className={`w-6 h-6 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
        </div>
      </div>
    </div>
  );
};