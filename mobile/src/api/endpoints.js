import axiosInstance from './axiosInstance';

// Auth Endpoints
export const loginApi = async (username, password) => {
  const response = await axiosInstance.post('/auth/login', { username, password });
  return response.data;
};

export const changePasswordApi = async (payload) => {
  const response = await axiosInstance.post('/auth/change-password', payload);
  return response.data;
};

export const changeActionPasswordApi = async (payload) => {
  const response = await axiosInstance.post('/auth/change-action-password', payload);
  return response.data;
};

export const verifyActionPasswordApi = async (password, id, username) => {
  const response = await axiosInstance.post('/auth/verify-password', { password, id, username });
  return response.data;
};

// Party Master Endpoints
export const fetchPartiesApi = async () => {
  const response = await axiosInstance.get('/parties');
  return response.data || [];
};

export const savePartyApi = async (partyData) => {
  const response = await axiosInstance.post('/parties', partyData);
  return response.data;
};

export const deletePartyApi = async (id) => {
  const response = await axiosInstance.delete(`/parties/${id}`);
  return response.data;
};

// Truck Master Endpoints
export const fetchTrucksApi = async () => {
  const response = await axiosInstance.get('/trucks');
  return response.data || [];
};

export const saveTruckApi = async (truckData) => {
  const response = await axiosInstance.post('/trucks', truckData);
  return response.data;
};

export const deleteTruckApi = async (id) => {
  const response = await axiosInstance.delete(`/trucks/${id}`);
  return response.data;
};

// LR Entries Endpoints
export const fetchLREntriesApi = async () => {
  const response = await axiosInstance.get('/lr-entries');
  return response.data || [];
};

export const saveLREntryApi = async (lrData) => {
  const response = await axiosInstance.post('/lr-entries', lrData);
  return response.data;
};

export const deleteLREntryApi = async (id) => {
  const response = await axiosInstance.delete(`/lr-entries/${id}`);
  return response.data;
};

export const updateLRPaymentStatusApi = async (id, statusPayload) => {
  const response = await axiosInstance.put(`/lr-entries/${id}/payment-status`, statusPayload);
  return response.data;
};

export const dismissTruckComingApi = async (id) => {
  const response = await axiosInstance.put(`/lr-entries/${id}/dismiss-truck-coming`);
  return response.data;
};

// Truck Payments Endpoints
export const fetchTruckPaymentsApi = async () => {
  const response = await axiosInstance.get('/truck-payments');
  return response.data || [];
};

export const saveTruckPaymentApi = async (paymentData) => {
  const response = await axiosInstance.post('/truck-payments', paymentData);
  return response.data;
};

export const deleteTruckPaymentApi = async (id) => {
  const response = await axiosInstance.delete(`/truck-payments/${id}`);
  return response.data;
};

// Party Orders Endpoints
export const fetchPartyOrdersApi = async (partyId) => {
  const url = partyId ? `/party-orders?partyId=${partyId}` : '/party-orders';
  const response = await axiosInstance.get(url);
  return response.data || [];
};

export const savePartyOrderApi = async (orderData) => {
  const response = await axiosInstance.post('/party-orders', orderData);
  return response.data;
};

export const updatePartyOrderStatusApi = async (id, status, notes) => {
  const response = await axiosInstance.put(`/party-orders/${id}/status`, { status, notes });
  return response.data;
};

// Truck Orders Endpoints
export const fetchTruckOrdersApi = async (truckNo) => {
  const url = truckNo ? `/truck-orders?truckNo=${truckNo}` : '/truck-orders';
  const response = await axiosInstance.get(url);
  return response.data || [];
};

export const saveTruckOrderApi = async (orderData) => {
  const response = await axiosInstance.post('/truck-orders', orderData);
  return response.data;
};

export const updateTruckOrderStatusApi = async (id, status, notes) => {
  const response = await axiosInstance.put(`/truck-orders/${id}/status`, { status, notes });
  return response.data;
};

// PDF Generation Endpoint
export const fetchLRPdfBlobApi = async (payload) => {
  const response = await axiosInstance.post('/lr/generate-pdf', payload, {
    responseType: 'arraybuffer',
  });
  return response.data;
};
