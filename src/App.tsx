import { useState, useCallback, useEffect } from 'react';
import './App.css';
import { ItemList } from './components/ItemList';
import { SelectedList } from './components/SelectedList';
import { AddItem } from './components/AddItem';
import { api } from './services/api';

function App() {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedRefreshKey, setSelectedRefreshKey] = useState(0);

  useEffect(() => {
    const loadState = async () => {
      try {
        const response = await api.getState();
        if (response.selectedIds) {
          setSelectedIds(new Set(response.selectedIds));
        }
      } catch (error) {
        console.error('Failed to load state:', error);
      }
    };
    
    loadState();
  }, []);

  const handleSelect = useCallback(async (id: number) => {
    try {
      await api.selectItem(id);
      setSelectedIds(prev => new Set([...prev, id]));
      setSelectedRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to select item:', error);
    }
  }, []);

  const handleUnselect = useCallback(async (id: number) => {
    try {
      await api.unselectItem(id);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setRefreshKey(prev => prev + 1);
      setSelectedRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to unselect item:', error);
    }
  }, []);

  const handleReorder = useCallback(async (itemIds: number[]) => {
    try {
      await api.reorderItems(itemIds);
      // Убираем обновление refreshKey для reorder - локальное состояние уже обновлено
    } catch (error) {
      console.error('Failed to reorder items:', error);
    }
  }, []);

  const handleItemAdded = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Управление списками</h1>
        <AddItem onAdd={handleItemAdded} />
      </header>
      <main className="app-main">
        <ItemList
          onSelect={handleSelect}
          selectedIds={selectedIds}
          refreshKey={refreshKey}
        />
        <SelectedList
          onUnselect={handleUnselect}
          onReorder={handleReorder}
          refreshKey={selectedRefreshKey}
        />
      </main>
    </div>
  );
}

export default App;