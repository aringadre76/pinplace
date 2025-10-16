import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateMap } from '../hooks/useCreateMap';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const CreateMap: React.FC = () => {
  const navigate = useNavigate();
  const { createMap, loading, error } = useCreateMap();
  const [formData, setFormData] = useState({
    name: '',
    lockType: 'manual' as 'manual' | 'duration' | 'datetime',
    duration: 24,
    lockDate: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    try {
      await createMap({
        name: formData.name.trim(),
        lockType: formData.lockType,
        duration: formData.lockType === 'duration' ? formData.duration : undefined,
        lockDate: formData.lockType === 'datetime' ? new Date(formData.lockDate) : undefined
      });
      
      navigate(`/dashboard`);
    } catch (err) {
      console.error('Failed to create map:', err);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Map</h1>
        <p className="mt-2 text-gray-600">
          Create a collaborative map that others can add pins to.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Map Name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., High School Friends, Company Offsite"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Lock Settings
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="lockType"
                  value="manual"
                  checked={formData.lockType === 'manual'}
                  onChange={(e) => handleInputChange('lockType', e.target.value)}
                  className="mr-2"
                />
                <span>Manual lock only (you control when to lock)</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="lockType"
                  value="duration"
                  checked={formData.lockType === 'duration'}
                  onChange={(e) => handleInputChange('lockType', e.target.value)}
                  className="mr-2"
                />
                <span>Auto-lock after duration</span>
              </label>
              
              {formData.lockType === 'duration' && (
                <div className="ml-6">
                  <Input
                    label="Duration (hours)"
                    type="number"
                    min="1"
                    max="8760"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 24)}
                  />
                </div>
              )}
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="lockType"
                  value="datetime"
                  checked={formData.lockType === 'datetime'}
                  onChange={(e) => handleInputChange('lockType', e.target.value)}
                  className="mr-2"
                />
                <span>Auto-lock at specific date/time</span>
              </label>
              
              {formData.lockType === 'datetime' && (
                <div className="ml-6">
                  <Input
                    label="Lock Date & Time"
                    type="datetime-local"
                    value={formData.lockDate}
                    onChange={(e) => handleInputChange('lockDate', e.target.value)}
                    required={formData.lockType === 'datetime'}
                  />
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex space-x-4">
            <Button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Create Map'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/dashboard')}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
