import { useCallback, useEffect, useState } from 'react';
import { getProject } from '../api/projects';

const useProject = (projectId) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(() => {
    if (!projectId) return Promise.resolve();
    setLoading(true);
    setError('');
    return getProject(projectId)
      .then(({ data }) => setProject(data.data))
      .catch((err) => setError(err.response?.data?.message ?? 'Failed to load project.'))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { project, setProject, loading, error, refresh };
};

export default useProject;
