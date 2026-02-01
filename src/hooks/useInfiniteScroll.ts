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
  loadMoreRef: (node?: Element | null) => void;
}

export function useInfiniteScroll<T>({
  fetchFn,
  filter: initialFilter = '',
  initialLimit = 20,
  refreshKey = 0
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilterState] = useState(initialFilter);
  const [debouncedFilter, setDebouncedFilter] = useState(initialFilter);
  const loadingRef = useRef(false);
  const debounceTimeoutRef = useRef<number | null>(null);
  const fetchFnRef = useRef(fetchFn);

  // Update fetchFn ref when it changes
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px'
  });

  // Debounce filter changes
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = window.setTimeout(() => {
      setDebouncedFilter(filter);
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [filter]);

  const fetchItems = useCallback(async (pageNum: number, filterStr: string, isRefresh = false) => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await fetchFnRef.current(pageNum, filterStr);
      const newItems = response.items;
      const totalCount = response.total;

      setItems(prev => {
        if (isRefresh) {
          setHasMore(newItems.length < totalCount);
          return newItems;
        } else {
          const updatedItems = [...prev, ...newItems];
          setHasMore(updatedItems.length < totalCount);
          return updatedItems;
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && !loadingRef.current && hasMore) {
      const nextPage = Math.floor(items.length / initialLimit);
      fetchItems(nextPage, debouncedFilter);
    }
  }, [loading, hasMore, items.length, debouncedFilter, fetchItems, initialLimit]);

  const refresh = useCallback(() => {
    setItems([]);
    setHasMore(true);
    fetchItems(0, debouncedFilter, true);
  }, [debouncedFilter, fetchItems]);

  const setFilter = useCallback((newFilter: string) => {
    setFilterState(newFilter);
  }, []);

  // Fetch when debouncedFilter changes
  useEffect(() => {
    setItems([]);
    setHasMore(true);
    fetchItems(0, debouncedFilter, true);
  }, [debouncedFilter, fetchItems]);

  // Fetch when refreshKey changes
  useEffect(() => {
    if (refreshKey > 0) {
      setItems([]);
      setHasMore(true);
      fetchItems(0, debouncedFilter, true);
    }
  }, [refreshKey, debouncedFilter, fetchItems]);

  useEffect(() => {
    if (inView && !loadingRef.current && hasMore && items.length > 0) {
      loadMore();
    }
  }, [inView, hasMore, loading, loadMore, items.length]);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    setFilter,
    loadMoreRef
  };
}