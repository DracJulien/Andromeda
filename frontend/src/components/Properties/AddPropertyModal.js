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
      <div className="relative bg-orbit-panel border border-[#1F2937] rounded-sm w-full max-w-lg p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sm bg-orbit-blue/10">
              <Building2 size={18} className="text-orbit-blue" />
            </div>
            <h2 className="font-heading text-xl font-semibold uppercase tracking-wide text-white">
              Register Property
            </h2>
          </div>
          <button
            data-testid="close-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1.5">
              Property Name *
            </label>
            <input
              data-testid="property-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Villa Sunset Paradise"
              className="w-full px-3 py-2.5 bg-orbit-surface border border-[#1F2937] rounded-sm text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orbit-blue transition-colors font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1.5">
              Booking.com URL
            </label>
            <input
              data-testid="booking-url-input"
              type="text"
              value={bookingUrl}
              onChange={(e) => setBookingUrl(e.target.value)}
              placeholder="Leave empty for mock calendar"
              className="w-full px-3 py-2.5 bg-orbit-surface border border-[#1F2937] rounded-sm text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orbit-blue transition-colors font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1.5">
              Airbnb URL
            </label>
            <input
              data-testid="airbnb-url-input"
              type="text"
              value={airbnbUrl}
              onChange={(e) => setAirbnbUrl(e.target.value)}
              placeholder="Leave empty for mock calendar"
              className="w-full px-3 py-2.5 bg-orbit-surface border border-[#1F2937] rounded-sm text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orbit-blue transition-colors font-mono"
            />
          </div>

          <p className="text-[10px] font-mono text-gray-600">
            Leave URLs empty to use local mock calendars for testing.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              data-testid="cancel-add-btn"
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-sm bg-[#1F2937] text-gray-300 hover:bg-[#374151] text-sm font-medium transition-colors border border-[#374151]"
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
