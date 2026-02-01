import { memo } from 'react';
import type { Item, SelectedItem } from '../services/api';

interface ItemCardProps {
  item: Item | SelectedItem;
  onSelect?: (id: number) => void;
  onUnselect?: (id: number) => void;
  isSelected?: boolean;
  draggable?: boolean;
}

export const ItemCard = memo(function ItemCard({
  item,
  onSelect,
  onUnselect,
  isSelected = false,
  draggable = false
}: ItemCardProps) {
  return (
    <div
      className={`item-card ${isSelected ? 'selected' : ''}`}
      onClick={() => isSelected ? onUnselect?.(item.id) : onSelect?.(item.id)}
      draggable={draggable}
    >
      <span className="item-id">{item.id}</span>
      <span className="item-name">{item.name}</span>
      {isSelected && <span className="selected-badge">Selected</span>}
    </div>
  );
});