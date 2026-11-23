import { useCallback, useEffect, useRef, useState } from 'react';
import { listInquiries } from '../api/inquiries';

export function useInquiryList({ status, search }) {
  const [inquiries, setInquiries] = useState(null); // null = not loaded yet
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setLoading(true);
    setError(null);
    try {
      const data = await listInquiries({ status, search });
      // Ignore responses from older requests (e.g. user kept typing)
      if (requestId === latestRequest.current) setInquiries(data);
    } catch (err) {
      if (requestId === latestRequest.current) setError(err);
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    load();
  }, [load]);

  // Refresh when the user returns to this tab, so statuses don't go stale
  useEffect(() => {
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, [load]);

  return { inquiries, loading, error, reload: load };
}