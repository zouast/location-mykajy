import api from './api';

export const VisitsService = {
  createVisit: (payload: any) => api.post('/visits', payload).then((r) => r.data),
  getVisits: (params: any) => api.get('/visits', { params }).then((r) => r.data),
  updateStatus: (id: string, payload: any) => api.patch(`/visits/${id}/status`, payload).then((r) => r.data),
};

export default VisitsService;
