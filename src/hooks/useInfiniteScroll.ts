import { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

interface UseInfiniteScrollOptions<T> {
  fetchFn: (page: number, filter?: string) => Promise<{ items: T[]; total: number }>;
  filter?: string;
  initialLimit?: number;
  refreshKey?: number;
}

interface UseInfiniteScrollResult<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  setFilter: (filter: string) => void;
  loadMoreRef: React.RefObject<HTMLDivElement>;
}

export function useInfiniteScroll<T>({
  fetchFn,
  filter: initialFilter = '',
  initialLimit = 20,
  refreshKey = 0
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilterState] = useState(initialFilter);
  const [total, setTotal] = useState(0);
  const loadingRef = useRef(false);

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px'
  });

  const fetchItems = useCallback(async (pageNum: number, filterStr: string, isRefresh = false) => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await fetchFn(pageNum, filterStr);
      const newItems = response.items;
      const totalCount = response.total;

      setItems(prev => isRefresh ? newItems : [...prev, ...newItems]);
      setTotal(totalCount);
      setHasMore((isRefresh ? 0 : items.length) + newItems.length < totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [fetchFn, items.length]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingRef.current && hasMore) {
      const nextPage = Math.floor(items.length / initialLimit);
      fetchItems(nextPage, filter);
      setPage(nextPage);
    }
  }, [loading, hasMore, items.length, filter, fetchItems, initialLimit]);

  const refresh = useCallback(() => {
    setItems([]);
    setPage(0);
    setHasMore(true);
    fetchItems(0, filter, true);
  }, [filter, fetchItems]);

  const setFilter = useCallback((newFilter: string) => {
    setFilterState(newFilter);
    setItems([]);
    setPage(0);
    setHasMore(true);
    fetchItems(0, newFilter, true);
  }, [fetchItems]);

  useEffect(() => {
    setItems([]);
    setPage(0);
    setHasMore(true);
    fetchItems(0, filter, true);
  }, [refreshKey]);

  useEffect(() => {
    if (inView && !loadingRef.current && hasMore) {
      loadMore();
    }
  }, [inView, hasMore, loading, loadMore]);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    setFilter,
    loadMoreRef: loadMoreRef as React.RefObject<HTMLDivElement>
  };
}