import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Building2 } from 'lucide-react';
import PropertyCard from './PropertyCard';
import AddPropertyModal from './AddPropertyModal';

export default function PropertyGrid({ api }) {
  const [properties, setProperties] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProperties = useCallback(async () => {
    try {
      const token = localStorage.getItem('orbit_token');
      const h = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`${api}/api/properties`, { credentials: 'include', headers: h });
      setProperties(await res.json());
    } catch {}
    setLoading(false);
  }, [api]);

  useEffect(() => {
    fetchProperties();
    const interval = setInterval(fetchProperties, 5000);
    return () => clearInterval(interval);
  }, [fetchProperties]);

  const handleSync = async (propertyId) => {
    const token = localStorage.getItem('orbit_token');
    const h = token ? { 'Authorization': `Bearer ${token}` } : {};
    await fetch(`${api}/api/properties/${propertyId}/sync`, { method: 'POST', credentials: 'include', headers: h });
    fetchProperties();
  };

  const handleDelete = async (propertyId) => {
    const token = localStorage.getItem('orbit_token');
    const h = token ? { 'Authorization': `Bearer ${token}` } : {};
    await fetch(`${api}/api/properties/${propertyId}`, { method: 'DELETE', credentials: 'include', headers: h });
    fetchProperties();
  };

  const handleAdd = async (data) => {
    const token = localStorage.getItem('orbit_token');
    const h = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
    await fetch(`${api}/api/properties`, {
      method: 'POST', credentials: 'include',
      headers: h,
      body: JSON.stringify(data),
    });
    setShowAdd(false);
    fetchProperties();
  };

  return (
    <div data-testid="property-grid-page" className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight uppercase text-orbit-text-main">
            Properties
          </h1>
          <p className="text-sm text-orbit-text-dim mt-1 font-mono">
            {properties.length} registered {properties.length === 1 ? 'property' : 'properties'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            data-testid="refresh-properties-btn"
            onClick={fetchProperties}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-sm bg-orbit-bg-surface text-orbit-text-main hover:bg-orbit-bg-panel text-sm font-medium transition-colors border border-orbit-border-main"
          >
            <RefreshCw size={14} />
          </button>
          <button
            data-testid="add-property-btn"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-orbit-blue text-white hover:bg-orbit-blue-hover text-sm font-medium transition-colors shadow-[0_0_10px_rgba(0,112,243,0.3)]"
          >
            <Plus size={14} />
            Add Property
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="text-orbit-blue animate-spin" />
        </div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-sm bg-orbit-bg-panel border border-orbit-border-main flex items-center justify-center mb-4">
            <Building2 size={28} className="text-orbit-text-dim opacity-50" />
          </div>
          <p className="text-orbit-text-dim text-sm font-medium">No properties registered</p>
          <p className="text-orbit-text-dim/70 text-xs mt-1 font-mono">Add a property to begin orbital sync</p>
          <button
            data-testid="add-first-property-btn"
            onClick={() => setShowAdd(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-orbit-blue text-white text-sm font-medium hover:bg-orbit-blue-hover transition-colors"
          >
            <Plus size={14} />
            Add First Property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map((prop, i) => (
            <PropertyCard
              key={prop.property_id}
              property={prop}
              onSync={() => handleSync(prop.property_id)}
              onDelete={() => handleDelete(prop.property_id)}
              index={i}
            />
          ))}
        </div>
      )}

      {showAdd && <AddPropertyModal onClose={() => setShowAdd(false)} onSubmit={handleAdd} />}
    </div>
  );
}
