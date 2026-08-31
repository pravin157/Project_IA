import { apiClient } from '../common/apiClient';
import { ENDPOINTS } from '../common/endpoints';

export interface GetPaymentHistoryParams {
  organizationId?: string;
  searchParam?: string;
  paymentTransactionStatus?: string;
  startDate?: number;
  endDate?: number;
  pageNumber?: number;
  rowsPerPage?: number;
}

export interface PaymentHistoryResponse {
  result: any[];
  pageCount: number;
  totalCount: number;
}

export async function getPaymentHistoryApi(params: GetPaymentHistoryParams): Promise<PaymentHistoryResponse> {
  const response = await apiClient.post(ENDPOINTS.SALES.PAYMASTER_ADMIN, {
    eventType: 'GET_ADMIN_PAYMENT_HISTORY',
    ...params,
  });
  
  const data = response.data as any;
  if (data && data.code === 'RECEIPTS_DETAILS_RETRIEVED') {
    return data.body || { result: [], pageCount: 0, totalCount: 0 };
  }
  throw new Error(data?.message || 'Failed to retrieve subscription payment history.');
}
