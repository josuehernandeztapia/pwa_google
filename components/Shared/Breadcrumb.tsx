

import React from 'react';
import { NavigationContext, Client } from '../../types/index';
import { HomeIcon, ChevronRightIcon } from './Icon';

interface BreadcrumbProps {
  context: NavigationContext;
  client?: Client;
  onNavigate: (level: 'root' | 'ecosystem' | 'group') => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ context, client, onNavigate }) => {
  const { ecosystem, group } = context;

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-4">
      <button onClick={() => onNavigate('root')} className="flex items-center gap-2 hover:text-white transition-colors">
        <HomeIcon className="w-5 h-5" />
        <span>Ecosistemas</span>
      </button>

      {ecosystem && (
        <>
          <ChevronRightIcon className="w-4 h-4 text-gray-600" />
          <button
            onClick={() => onNavigate('ecosystem')}
            disabled={!group && !client} // Disable if we are already at the ecosystem level
            className={`hover:text-white transition-colors ${!group && !client ? 'text-white font-semibold' : ''}`}
          >
            {ecosystem.name}
          </button>
        </>
      )}

      {group && (
        <>
          <ChevronRightIcon className="w-4 h-4 text-gray-600" />
          <button
            onClick={() => onNavigate('group')}
            disabled={!client} // Disable if we are at the group level
            className={`hover:text-white transition-colors ${!client ? 'text-white font-semibold' : ''}`}
          >
            {group.name}
          </button>
        </>
      )}
      
      {client && (
        <>
          <ChevronRightIcon className="w-4 h-4 text-gray-600" />
          <span className="font-semibold text-white">{client.name}</span>
        </>
      )}
    </nav>
  );
};
