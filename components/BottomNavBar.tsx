


import React from 'react';
import { DashboardIcon, ChartBarIcon, UserGroupIcon, CalculatorIcon } from './icons';
import { View } from './Sidebar';

interface BottomNavBarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  alertCounts: { [key in View]?: number };
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
    alertCount?: number;
}> = ({ icon, label, active, onClick, alertCount }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${active ? 'text-primary-cyan-400' : 'text-gray-400 hover:text-white'}`}
    >
        <div className="relative">
            {icon}
            {alertCount && alertCount > 0 && (
                 <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-gray-900">
                    {alertCount}
                </span>
            )}
        </div>
        <span className="text-xs mt-1">{label}</span>
    </button>
);


export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, onViewChange, alertCounts }) => {
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-gray-900 border-t border-gray-800 flex justify-around items-center z-40">
            <NavItem 
                icon={<DashboardIcon className="w-6 h-6"/>}
                label="Dashboard"
                active={activeView === 'dashboard'}
                onClick={() => onViewChange('dashboard')}
            />
            <NavItem 
                icon={<ChartBarIcon className="w-6 h-6"/>}
                label="Oportunidades"
                active={activeView === 'oportunidades'}
                onClick={() => onViewChange('oportunidades')}
                alertCount={alertCounts.oportunidades}
            />
             <NavItem 
                icon={<UserGroupIcon className="w-6 h-6"/>}
                label="Clientes"
                active={activeView === 'clientes'}
                onClick={() => onViewChange('clientes')}
                alertCount={alertCounts.clientes}
            />
             <NavItem 
                icon={<CalculatorIcon className="w-6 h-6"/>}
                label="Simulador"
                active={activeView === 'simulador'}
                onClick={() => onViewChange('simulador')}
            />
        </div>
    );
};