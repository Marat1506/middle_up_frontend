import { useState } from 'react';
import { api } from '../services/api';

interface AddItemProps {
  onAdd: () => void;
}

export function AddItem({ onAdd }: AddItemProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await api.addItem(name);
      setName('');
      onAdd();
    } catch (error) {
      console.error('Failed to add item:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="add-item-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Название нового элемента..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="add-input"
        disabled={loading}
      />
      <button type="submit" disabled={loading || !name.trim()}>
        {loading ? 'Добавление...' : 'Добавить элемент'}
      </button>
    </form>
  );
}