import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SelectedItem, api } from '../services/api';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

interface SelectedListProps {
  onUnselect: (id: number) => void;
  onReorder: (itemIds: number[]) => void;
  refreshKey?: number;
}

interface SortableItemProps {
  item: SelectedItem;
  onUnselect: (id: number) => void;
}

function SortableItem({ item, onUnselect }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="sortable-item"
      {...attributes}
      {...listeners}
    >
      <span className="drag-handle">⋮⋮</span>
      <span className="item-id">{item.id}</span>
      <span className="item-name">{item.name}</span>
      <button
        className="unselect-btn"
        onClick={(e) => {
          e.stopPropagation();
          onUnselect(item.id);
        }}
      >
        ×
      </button>
    </div>
  );
}

function DragOverlayItem({ item }: { item: SelectedItem }) {
  return (
    <div className="sortable-item dragging">
      <span className="drag-handle">⋮⋮</span>
      <span className="item-id">{item.id}</span>
      <span className="item-name">{item.name}</span>
    </div>
  );
}

export function SelectedList({ onUnselect, onReorder, refreshKey = 0 }: SelectedListProps) {
  const [filter, setFilter] = useState('');
  const [activeId, setActiveId] = useState<number | null>(null);
  const [localItems, setLocalItems] = useState<SelectedItem[]>([]);

  const { items, loading, error, hasMore, loadMoreRef, setFilter: setFilterHook } = useInfiniteScroll<SelectedItem>({
    fetchFn: (page, filterStr) => api.getSelected(filterStr, page),
    filter,
    initialLimit: 20,
    refreshKey
  });

  // Синхронизируем локальное состояние с данными с сервера
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = localItems.findIndex(item => item.id === active.id);
      const newIndex = localItems.findIndex(item => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // Сначала обновляем локальное состояние для мгновенного отклика
        const newItems = arrayMove(localItems, oldIndex, newIndex);
        setLocalItems(newItems);
        
        // Затем отправляем на сервер
        const itemIds = newItems.map(item => item.id);
        try {
          await onReorder(itemIds);
        } catch (error) {
          console.error('Failed to reorder:', error);
          // В случае ошибки возвращаем исходное состояние
          setLocalItems(items);
        }
      }
    }
  }, [localItems, onReorder, items]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilter(value);
    setFilterHook(value);
  };

  const activeItem = activeId ? localItems.find(item => item.id === activeId) : null;

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Selected Items</h2>
        <input
          type="text"
          placeholder="Filter by ID..."
          value={filter}
          onChange={handleFilterChange}
          className="filter-input"
        />
      </div>
      <div className="panel-content">
        {error && <div className="error">{error}</div>}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localItems.map(item => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="selected-list">
              {localItems.map(item => (
                <SortableItem
                  key={item.id}
                  item={item}
                  onUnselect={onUnselect}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeItem ? <DragOverlayItem item={activeItem} /> : null}
          </DragOverlay>
        </DndContext>
        {loading && <div className="loading">Loading...</div>}
        <div ref={loadMoreRef} className="load-more" />
      </div>
    </div>
  );
}