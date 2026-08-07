import { apiClient } from '../common/apiClient';
import { ENDPOINTS } from '../common/endpoints';

export interface PaymentGatewayDetails {
  countryCode: string;
  countryName?: string;
  currencyCode?: string;
  currencySymbol?: string;
  [key: string]: any;
}

export async function getPaymentGatewayDetailsApi(countryCode: string): Promise<PaymentGatewayDetails | null> {
  try {
    const response = await apiClient.post(ENDPOINTS.SALES.SESSION, {
      eventType: 'FETCH_PAYMENT_GATEWAY_DETAILS',
      countryCode: countryCode.toUpperCase(),
    });

    const data = response.data as any;
    if (data && data.code === 'PAYMENT_GATEWAY_DETAILS_RETRIEVED' && data.body) {
      return data.body;
    }
    return data?.body || null;
  } catch (error) {
    console.error('Failed to fetch payment gateway details for country code:', countryCode, error);
    return null;
  }
}
