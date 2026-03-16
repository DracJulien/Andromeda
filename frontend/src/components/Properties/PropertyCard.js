import React from 'react';
import { RefreshCw, Trash2, ExternalLink, Clock, CheckCircle, AlertTriangle, XCircle, Loader } from 'lucide-react';

const statusConfig = {
  Online: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Online' },
  Syncing: { icon: Loader, color: 'text-yellow-600', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'Syncing' },
  Error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Error' },
  'Action Required': { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'Action Required' },
};

export default function PropertyCard({ property, onSync, onDelete, index }) {
  const status = statusConfig[property.status] || statusConfig.Online;
  const StatusIcon = status.icon;

  return (
    <div
      data-testid={`property-card-${property.property_id}`}
      className="bg-orbit-bg-panel border border-orbit-border-main rounded-sm overflow-hidden group hover:border-orbit-text-dim/30 transition-colors animate-slide-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-lg font-semibold text-orbit-text-main truncate uppercase tracking-wide">
              {property.name}
            </h3>
            <p className="text-[10px] font-mono text-orbit-text-dim mt-0.5">
              ID: {property.property_id.slice(0, 8)}
            </p>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-mono uppercase tracking-wider ${status.bg} ${status.color} border ${status.border}`}>
            <StatusIcon size={10} className={property.status === 'Syncing' ? 'animate-spin' : ''} />
            {status.label}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-orbit-text-dim font-mono w-16 flex-shrink-0">BOOKING</span>
            <span className="text-orbit-text-dim/80 truncate font-mono text-[11px]">
              {property.booking_url ? (property.booking_url.startsWith('file://') ? 'Mock Calendar' : property.booking_url) : 'Not set'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-orbit-text-dim font-mono w-16 flex-shrink-0">AIRBNB</span>
            <span className="text-orbit-text-dim/80 truncate font-mono text-[11px]">
              {property.airbnb_url ? (property.airbnb_url.startsWith('file://') ? 'Mock Calendar' : property.airbnb_url) : 'Not set'}
            </span>
          </div>
        </div>

        {property.booked_dates?.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-mono uppercase tracking-wider text-orbit-text-dim mb-1">Synced Dates</p>
            <div className="flex flex-wrap gap-1">
              {property.booked_dates.slice(0, 6).map((d) => (
                <span key={d} className="px-1.5 py-0.5 bg-orbit-blue/10 text-orbit-blue text-[10px] font-mono rounded-sm">
                  {d}
                </span>
              ))}
              {property.booked_dates.length > 6 && (
                <span className="px-1.5 py-0.5 text-orbit-text-dim/60 text-[10px] font-mono">
                  +{property.booked_dates.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-orbit-border-main">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-orbit-text-dim">
            <Clock size={10} />
            {property.last_sync
              ? `Synced ${new Date(property.last_sync).toLocaleTimeString()}`
              : 'Never synced'}
          </div>
          <div className="flex items-center gap-1">
            <button
              data-testid={`sync-btn-${property.property_id}`}
              onClick={onSync}
              disabled={property.status === 'Syncing'}
              className="p-1.5 rounded-sm text-orbit-text-dim hover:text-orbit-blue hover:bg-orbit-blue/10 transition-colors disabled:opacity-30"
              title="Trigger Sync"
            >
              <RefreshCw size={14} className={property.status === 'Syncing' ? 'animate-spin' : ''} />
            </button>
            <button
              data-testid={`delete-btn-${property.property_id}`}
              onClick={onDelete}
              className="p-1.5 rounded-sm text-orbit-text-dim hover:text-orbit-error hover:bg-red-500/10 transition-colors"
              title="Delete Property"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
