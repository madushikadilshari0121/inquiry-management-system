import { useCallback, useEffect, useState } from 'react';
import { getInquiry } from '../api/inquiries';

export function useInquiry(id) {
  const [inquiry, setInquiry] = useState(null);
  const [error, setError] = useState(null);

  // Returns the latest inquiry (or null on failure) so callers can react to it
  const load = useCallback(async () => {
    try {
      const data = await getInquiry(id);
      setInquiry(data);
      setError(null);
      return data;
    } catch (err) {
      setError(err);
      return null;
    }
  }, [id]);

  useEffect(() => {
    setInquiry(null);
    setError(null);
    load();
  }, [load]);

  return { inquiry, setInquiry, error, reload: load };
}