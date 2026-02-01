import { useState } from 'react';
import type { Item } from '../services/api';
import { api } from '../services/api';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { ItemCard } from './ItemCard';

interface ItemListProps {
  onSelect: (id: number) => void;
  selectedIds: Set<number>;
  refreshKey?: number;
}

export function ItemList({ onSelect, selectedIds, refreshKey = 0 }: ItemListProps) {
  const [filter, setFilter] = useState('');

  const { items, loading, error, loadMoreRef, setFilter: setFilterHook } = useInfiniteScroll<Item>({
    fetchFn: (page, filterStr) => api.getItems(filterStr, page),
    filter,
    initialLimit: 20,
    refreshKey
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilter(value);
    setFilterHook(value);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Все элементы</h2>
        <input
          type="text"
          placeholder="Поиск по ID..."
          value={filter}
          onChange={handleFilterChange}
          className="filter-input"
        />
      </div>
      <div className="panel-content">
        {error && <div className="error">{error}</div>}
        <div className="items-grid">
          {items.filter(item => !selectedIds.has(item.id)).map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onSelect={onSelect}
            />
          ))}
        </div>
        {loading && <div className="loading">Загрузка...</div>}
        <div ref={loadMoreRef} className="load-more" />
      </div>
    </div>
  );
}