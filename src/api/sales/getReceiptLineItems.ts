import { apiClient } from '../common/apiClient';
import { ENDPOINTS } from '../common/endpoints';

export async function getReceiptLineItemsApi(sphId: string): Promise<any[]> {
  const response = await apiClient.post(ENDPOINTS.SALES.PAYMASTER, {
    eventType: 'GET_RECEIPT_LINE_ITEMS',
    sphId,
  });
  
  const data = response.data as any;
  if (data && data.code === 'RECEIPTS_DETAILS_RETRIEVED') {
    return data.body || [];
  }
  throw new Error(data?.message || 'Failed to retrieve receipt line items.');
}
