import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
export function useLoad(path, onResult) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);
  const reload = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const result = await api(path);
      if (id === requestId.current) {
        setData(result);
        onResult?.(result);
      }
    } catch (e) {
      if (id === requestId.current) setError(e.message);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [path, onResult]);
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) reload();
    });
    // Ignore older responses after the user changes pages or filters.
    return () => {
      active = false;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      requestId.current++;
    };
  }, [reload]);
  return {
    data,
    error,
    loading,
    reload,
  };
}
