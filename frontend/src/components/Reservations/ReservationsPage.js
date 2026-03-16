import React, { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Plus, Trash2, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

function getAuthHeaders() {
  const token = localStorage.getItem('orbit_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function MiniCalendar({ reservations, month, year, onPrev, onNext }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  const bookedDates = new Set();
  reservations.forEach(r => {
    const ci = new Date(r.check_in);
    const co = new Date(r.check_out);
    for (let d = new Date(ci); d <= co; d.setDate(d.getDate() + 1)) {
      if (d.getMonth() === month && d.getFullYear() === year) {
        bookedDates.add(d.getDate());
      }
    }
  });

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(<div key={`e${i}`} />);
  for (let d = 1; d <= daysInMonth; d++) {
    const isBooked = bookedDates.has(d);
    const isToday = new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year;
    cells.push(
      <div key={d} className={`text-center py-1 text-xs font-mono rounded-sm ${
        isBooked ? 'bg-orbit-blue/20 text-orbit-blue' :
        isToday ? 'bg-white/5 text-white' :
        'text-gray-600'
      }`}>{d}</div>
    );
  }

  return (
    <div className="bg-orbit-panel border border-[#1F2937] rounded-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrev} className="p-1 text-gray-500 hover:text-gray-300"><ChevronLeft size={14} /></button>
        <span className="text-sm font-heading uppercase tracking-wider text-gray-300">{MONTHS[month]} {year}</span>
        <button onClick={onNext} className="p-1 text-gray-500 hover:text-gray-300"><ChevronRight size={14} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
          <div key={d} className="text-center text-[9px] font-mono text-gray-600 uppercase">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">{cells}</div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#1F2937]">
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-gray-500">
          <div className="w-2 h-2 rounded-sm bg-orbit-blue/20" /> Booked
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-gray-500">
          <div className="w-2 h-2 rounded-sm bg-white/5 border border-gray-700" /> Today
        </div>
      </div>
    </div>
  );
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState('');
  const [filterProp, setFilterProp] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const [form, setForm] = useState({ property_id: '', guest_name: '', check_in: '', check_out: '', source: 'Manual', notes: '' });

  const load = useCallback(async () => {
    const h = { credentials: 'include', headers: getAuthHeaders() };
    const [rRes, pRes] = await Promise.all([
      fetch(`${API}/api/reservations${filterProp ? `?property_id=${filterProp}` : ''}`, h),
      fetch(`${API}/api/properties`, h),
    ]);
    setReservations(await rRes.json());
    setProperties(await pRes.json());
  }, [filterProp]);

  useEffect(() => { load(); const id = setInterval(load, 10000); return () => clearInterval(id); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    await fetch(`${API}/api/reservations`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(form),
    });
    setShowAdd(false);
    setForm({ property_id: '', guest_name: '', check_in: '', check_out: '', source: 'Manual', notes: '' });
    load();
  };

  const handleDelete = async (id) => {
    await fetch(`${API}/api/reservations/${id}`, { method: 'DELETE', credentials: 'include', headers: getAuthHeaders() });
    load();
  };

  const filtered = reservations.filter(r =>
    r.guest_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.property_name?.toLowerCase().includes(search.toLowerCase())
  );

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div data-testid="reservations-page" className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight uppercase text-white">Reservations</h1>
          <p className="text-sm text-gray-500 mt-1 font-mono">{reservations.length} total reservations</p>
        </div>
        <button data-testid="add-reservation-btn" onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-orbit-blue text-white text-sm font-medium hover:bg-orbit-blue-hover transition-colors shadow-[0_0_10px_rgba(0,112,243,0.3)]">
          <Plus size={14} /> Add Reservation
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <MiniCalendar reservations={reservations} month={month} year={year} onPrev={prevMonth} onNext={nextMonth} />
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-600" />
              <input data-testid="reservation-search" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search guest or property..."
                className="w-full pl-9 pr-3 py-2 bg-orbit-surface border border-[#1F2937] rounded-sm text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orbit-blue font-mono" />
            </div>
            <select data-testid="reservation-filter" value={filterProp} onChange={e => setFilterProp(e.target.value)}
              className="px-3 py-2 bg-orbit-surface border border-[#1F2937] rounded-sm text-sm text-gray-200 font-mono focus:outline-none focus:border-orbit-blue">
              <option value="">All Properties</option>
              {properties.map(p => <option key={p.property_id} value={p.property_id}>{p.name}</option>)}
            </select>
          </div>

          <div className="bg-orbit-panel border border-[#1F2937] rounded-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1F2937]">
                  {['Guest', 'Property', 'Check-in', 'Check-out', 'Source', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-600 font-mono">No reservations found</td></tr>
                ) : filtered.map(r => (
                  <tr key={r.reservation_id} data-testid={`reservation-row-${r.reservation_id}`} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-200">{r.guest_name}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">{r.property_name}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-300">{r.check_in}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-300">{r.check_out}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase ${
                        r.source?.includes('Agent') ? 'bg-orbit-blue/10 text-orbit-blue' : 'bg-gray-800 text-gray-400'
                      }`}>{r.source}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase ${
                        r.status === 'Confirmed' ? 'bg-emerald-900/20 text-emerald-400' :
                        r.status === 'Cancelled' ? 'bg-red-900/20 text-red-400' : 'bg-gray-800 text-gray-400'
                      }`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button data-testid={`delete-reservation-${r.reservation_id}`} onClick={() => handleDelete(r.reservation_id)}
                        className="p-1 text-gray-600 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" data-testid="add-reservation-modal">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative bg-orbit-panel border border-[#1F2937] rounded-sm w-full max-w-lg p-6 animate-slide-up">
            <h2 className="font-heading text-xl font-semibold uppercase tracking-wide text-white mb-4">New Reservation</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <select data-testid="res-property-select" value={form.property_id} onChange={e => setForm({...form, property_id: e.target.value})} required
                className="w-full px-3 py-2.5 bg-orbit-surface border border-[#1F2937] rounded-sm text-sm text-gray-200 font-mono focus:outline-none focus:border-orbit-blue">
                <option value="">Select Property</option>
                {properties.map(p => <option key={p.property_id} value={p.property_id}>{p.name}</option>)}
              </select>
              <input data-testid="res-guest-input" type="text" value={form.guest_name} onChange={e => setForm({...form, guest_name: e.target.value})}
                placeholder="Guest name" required
                className="w-full px-3 py-2.5 bg-orbit-surface border border-[#1F2937] rounded-sm text-sm text-gray-200 placeholder-gray-600 font-mono focus:outline-none focus:border-orbit-blue" />
              <div className="grid grid-cols-2 gap-3">
                <input data-testid="res-checkin-input" type="date" value={form.check_in} onChange={e => setForm({...form, check_in: e.target.value})} required
                  className="px-3 py-2.5 bg-orbit-surface border border-[#1F2937] rounded-sm text-sm text-gray-200 font-mono focus:outline-none focus:border-orbit-blue" />
                <input data-testid="res-checkout-input" type="date" value={form.check_out} onChange={e => setForm({...form, check_out: e.target.value})} required
                  className="px-3 py-2.5 bg-orbit-surface border border-[#1F2937] rounded-sm text-sm text-gray-200 font-mono focus:outline-none focus:border-orbit-blue" />
              </div>
              <select data-testid="res-source-select" value={form.source} onChange={e => setForm({...form, source: e.target.value})}
                className="w-full px-3 py-2.5 bg-orbit-surface border border-[#1F2937] rounded-sm text-sm text-gray-200 font-mono focus:outline-none focus:border-orbit-blue">
                <option>Manual</option><option>Booking.com</option><option>Airbnb</option><option>Direct</option>
              </select>
              <textarea data-testid="res-notes-input" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                placeholder="Notes (optional)" rows={2}
                className="w-full px-3 py-2.5 bg-orbit-surface border border-[#1F2937] rounded-sm text-sm text-gray-200 placeholder-gray-600 font-mono focus:outline-none focus:border-orbit-blue" />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 px-4 py-2.5 rounded-sm bg-[#1F2937] text-gray-300 hover:bg-[#374151] text-sm font-medium border border-[#374151]">Cancel</button>
                <button data-testid="submit-reservation-btn" type="submit"
                  className="flex-1 px-4 py-2.5 rounded-sm bg-orbit-blue text-white hover:bg-orbit-blue-hover text-sm font-medium shadow-[0_0_10px_rgba(0,112,243,0.3)]">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
