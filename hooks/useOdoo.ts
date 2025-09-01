import { useState, useEffect } from 'react';
import { OdooApiService } from '../services/api/odooApiService';

// In a real app, these would come from .env files
const ODOO_CONFIG = {
  baseUrl: 'https://conductores-del-mundo-sapi-de-cv.odoo.com',
  database: 'main',
  username: 'admin',
  password: 'your_password' // This should be securely managed
};

// Singleton instance
const odooServiceInstance = new OdooApiService(ODOO_CONFIG);

export const useOdoo = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    odooServiceInstance.authenticate()
    .then(() => {
        if (isMounted) setIsAuthenticated(true);
    })
    .catch(console.error)
    .finally(() => {
        if(isMounted) setIsLoading(false)
    });
    
    return () => { isMounted = false; };
  }, []);

  return {
    isAuthenticated,
    isLoading,
    odooService: odooServiceInstance,
    getClients: odooServiceInstance.getClients.bind(odooServiceInstance),
    createOpportunity: odooServiceInstance.createOpportunity.bind(odooServiceInstance),
  };
};