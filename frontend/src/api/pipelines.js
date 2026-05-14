import client from './client';

export const getPipelines = (projectId, params) => client.get(`/projects/${projectId}/pipelines`, { params });
export const getPipelineStats = (projectId) => {
  if (projectId) return client.get(`/projects/${projectId}/pipelines/stats`);
  // Global stats — backend route: GET /api/pipelines/stats
  return client.get('/pipelines/stats');
};

export const getPipeline = (id) => client.get(`/pipelines/${id}`);
export const overridePipeline = (id, data) => client.post(`/pipelines/${id}/override`, data);