import { apiRequest } from './client';

export async function listInquiries({ status, search } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (search) params.set('search', search);
  const qs = params.toString();
  const data = await apiRequest(`/inquiries${qs ? `?${qs}` : ''}`);
  return data.inquiries;
}

export async function getInquiry(id) {
  const data = await apiRequest(`/inquiries/${encodeURIComponent(id)}`);
  return data.inquiry;
}

export async function createInquiry(input) {
  const data = await apiRequest('/inquiries', { method: 'POST', body: input });
  return data.inquiry;
}

export async function updateInquiryStatus(id, status, version) {
  const data = await apiRequest(`/inquiries/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { status, version },
  });
  return data.inquiry;
}