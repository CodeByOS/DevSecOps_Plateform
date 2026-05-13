import { useCallback, useEffect, useState } from 'react';
import { getAuditLogs } from '../api/audit';

const useAuditLogs = (params = {}) => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(() => {
    setLoading(true);
    setError('');
    return getAuditLogs(params)
      .then(({ data }) => {
        setLogs(data.data ?? []);
        setTotal(data.total ?? 0);
        setPages(data.pages ?? 1);
      })
      .catch((err) => setError(err.response?.data?.message ?? 'Failed to load audit logs.'))
      .finally(() => setLoading(false));
  }, [JSON.stringify(params)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { logs, total, pages, loading, error, refresh };
};

export default useAuditLogs;
