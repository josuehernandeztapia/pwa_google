import { useCallback } from 'react';
import { ConektaService } from '../services/payments/conektaService';
// Fix: Correct import path to resolve type error.
import { PaymentLinkData, PaymentLinkResponse, OrderStatus } from '../types/index';

// In a real app, these would come from .env files and the private key would NEVER be here.
const CONEKTA_CONFIG = {
    publicKey: 'key_xxx',
    privateKey: 'key_xxx_SERVER_SIDE_ONLY', 
    baseUrl: 'https://api.conekta.io'
};

const conektaService = new ConektaService(CONEKTA_CONFIG);

export const useConekta = () => {
  const createPaymentLink = useCallback(async (data: PaymentLinkData) => {
    // In a real app, this hook would call our OWN backend, 
    // which would then securely call Conekta's API.
    return conektaService.createPaymentLink(data);
  }, []);

  const getOrderStatus = useCallback(async (orderId: string) => {
      return conektaService.getOrderStatus(orderId);
  }, []);

  return { 
      createPaymentLink, 
      getOrderStatus
  };
};