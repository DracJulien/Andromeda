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
      const res = await fetch(`${api}/api/properties`);
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
    await fetch(`${api}/api/properties/${propertyId}/sync`, { method: 'POST' });
    fetchProperties();
  };

  const handleDelete = async (propertyId) => {
    await fetch(`${api}/api/properties/${propertyId}`, { method: 'DELETE' });
    fetchProperties();
  };

  const handleAdd = async (data) => {
    await fetch(`${api}/api/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setShowAdd(false);
    fetchProperties();
  };

  return (
    <div data-testid="property-grid-page" className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight uppercase text-white">
            Properties
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-mono">
            {properties.length} registered {properties.length === 1 ? 'property' : 'properties'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            data-testid="refresh-properties-btn"
            onClick={fetchProperties}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-sm bg-[#1F2937] text-gray-300 hover:bg-[#374151] text-sm font-medium transition-colors border border-[#374151]"
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
          <div className="w-16 h-16 rounded-sm bg-orbit-panel border border-[#1F2937] flex items-center justify-center mb-4">
            <Building2 size={28} className="text-gray-600" />
          </div>
          <p className="text-gray-400 text-sm font-medium">No properties registered</p>
          <p className="text-gray-600 text-xs mt-1 font-mono">Add a property to begin orbital sync</p>
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
