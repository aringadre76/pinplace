import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface AddPinControlProps {
  position: { lat: number; lng: number };
  onSubmit: (data: { name: string; description?: string }) => void;
  onCancel: () => void;
}

export const AddPinControl: React.FC<AddPinControlProps> = ({ 
  position, 
  onSubmit, 
  onCancel 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() || undefined });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-80 z-10">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Add Pin</h3>
      <p className="text-sm text-gray-600 mb-4">
        Location: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter pin name"
          required
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Enter description"
          />
        </div>
        
        <div className="flex space-x-2">
          <Button
            type="submit"
            disabled={loading || !name.trim()}
            className="flex-1"
          >
            {loading ? 'Adding...' : 'Add Pin'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
