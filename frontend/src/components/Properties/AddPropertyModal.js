import React, { useState } from 'react';
import { X, Building2 } from 'lucide-react';

export default function AddPropertyModal({ onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');
  const [airbnbUrl, setAirbnbUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    await onSubmit({
      name: name.trim(),
      booking_url: bookingUrl.trim() || '',
      airbnb_url: airbnbUrl.trim() || '',
    });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" data-testid="add-property-modal">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-orbit-bg-panel border border-orbit-border-main rounded-sm w-full max-w-lg p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sm bg-orbit-blue/10">
              <Building2 size={18} className="text-orbit-blue" />
            </div>
            <h2 className="font-heading text-xl font-semibold uppercase tracking-wide text-orbit-text-main">
              Register Property
            </h2>
          </div>
          <button
            data-testid="close-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-sm text-orbit-text-dim hover:text-orbit-text-main hover:bg-orbit-bg-surface transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-orbit-text-dim mb-1.5">
              Property Name *
            </label>
            <input
              data-testid="property-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Villa Sunset Paradise"
              className="w-full px-3 py-2.5 bg-orbit-bg-surface border border-orbit-border-main rounded-sm text-sm text-orbit-text-main placeholder-orbit-text-dim/50 focus:outline-none focus:border-orbit-blue transition-colors font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-orbit-text-dim mb-1.5">
              Booking.com URL
            </label>
            <input
              data-testid="booking-url-input"
              type="text"
              value={bookingUrl}
              onChange={(e) => setBookingUrl(e.target.value)}
              placeholder="Leave empty for mock calendar"
              className="w-full px-3 py-2.5 bg-orbit-bg-surface border border-orbit-border-main rounded-sm text-sm text-orbit-text-main placeholder-orbit-text-dim/50 focus:outline-none focus:border-orbit-blue transition-colors font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-orbit-text-dim mb-1.5">
              Airbnb URL
            </label>
            <input
              data-testid="airbnb-url-input"
              type="text"
              value={airbnbUrl}
              onChange={(e) => setAirbnbUrl(e.target.value)}
              placeholder="Leave empty for mock calendar"
              className="w-full px-3 py-2.5 bg-orbit-bg-surface border border-orbit-border-main rounded-sm text-sm text-orbit-text-main placeholder-orbit-text-dim/50 focus:outline-none focus:border-orbit-blue transition-colors font-mono"
            />
          </div>

          <p className="text-[10px] font-mono text-orbit-text-dim/70">
            Leave URLs empty to use local mock calendars for testing.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              data-testid="cancel-add-btn"
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-sm bg-orbit-bg-surface text-orbit-text-main hover:bg-orbit-bg-panel text-sm font-medium transition-colors border border-orbit-border-main"
            >
              Cancel
            </button>
            <button
              data-testid="submit-property-btn"
              type="submit"
              disabled={!name.trim() || submitting}
              className="flex-1 px-4 py-2.5 rounded-sm bg-orbit-blue text-white hover:bg-orbit-blue-hover text-sm font-medium transition-colors shadow-[0_0_10px_rgba(0,112,243,0.3)] disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
