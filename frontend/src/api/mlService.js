import client from './client';

export const getModelInfo = async () => {
  const { data } = await client.get('/ml/info');
  return data;
};

export const retrainModel = async (samples) => {
  const { data } = await client.post('/ml/retrain', { samples });
  return data;
};
