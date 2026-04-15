import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for data fetching with loading and error states.
 * @param {Function} fetchFn - Async function that returns data
 * @param {Array} deps - Dependencies to trigger refetch
 * @param {boolean} immediate - Whether to fetch immediately (default: true)
 */
export default function useFetch(fetchFn, deps = [], immediate = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { data, loading, error, execute, setData };
}
