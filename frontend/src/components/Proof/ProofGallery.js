import React, { useState, useEffect } from 'react';
import { Image, X, Clock, ExternalLink, RefreshCw } from 'lucide-react';

export default function ProofGallery({ api }) {
  const [screenshots, setScreenshots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchScreenshots = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('orbit_token');
      const h = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`${api}/api/screenshots`, { credentials: 'include', headers: h });
      setScreenshots(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchScreenshots();
  }, [api]);

  return (
    <div data-testid="proof-gallery-page" className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight uppercase text-orbit-text-main">
            Proof Gallery
          </h1>
          <p className="text-sm text-orbit-text-dim mt-1 font-mono">
            Agent validation screenshots
          </p>
        </div>
        <button
          data-testid="refresh-screenshots-btn"
          onClick={fetchScreenshots}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-sm bg-orbit-bg-panel text-orbit-text-main hover:bg-orbit-bg-surface text-sm font-medium transition-colors border border-orbit-border-main"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="text-orbit-blue animate-spin" />
        </div>
      ) : screenshots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-sm bg-orbit-bg-panel border border-orbit-border-main flex items-center justify-center mb-4 shadow-sm">
            <Image size={28} className="text-orbit-text-dim/50" />
          </div>
          <p className="text-orbit-text-main/80 text-sm font-medium">No screenshots captured</p>
          <p className="text-orbit-text-dim text-xs mt-1 font-mono">
            Trigger a sync to generate validation proofs
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {screenshots.map((ss, i) => (
            <div
              key={ss.filename}
              data-testid={`screenshot-card-${i}`}
              onClick={() => setSelected(ss)}
              className="bg-orbit-bg-panel border border-orbit-border-main rounded-sm overflow-hidden cursor-pointer group hover:border-orbit-blue/50 transition-all hover:shadow-lg animate-slide-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="aspect-video bg-orbit-bg-surface relative overflow-hidden">
                <img
                  src={`${api}${ss.url}`}
                  alt={ss.filename}
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-orbit-bg-panel/80 to-transparent opacity-60" />
              </div>
              <div className="p-3">
                <p className="text-xs font-mono text-orbit-text-main truncate">{ss.filename}</p>
                <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-orbit-text-dim">
                  <Clock size={9} />
                  {new Date(ss.created).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div
          data-testid="screenshot-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative max-w-4xl w-full mx-4 bg-orbit-bg-panel border border-orbit-border-main rounded-sm overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-4 py-3 border-b border-orbit-border-main">
              <div>
                <p className="text-sm font-mono text-orbit-text-main">{selected.filename}</p>
                <p className="text-[10px] font-mono text-orbit-text-dim">
                  Captured: {new Date(selected.created).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`${api}${selected.url}`}
                  target="_blank"
                  rel="noreferrer"
                  data-testid="open-screenshot-external"
                  className="p-1.5 rounded-sm text-orbit-text-dim hover:text-orbit-text-main transition-colors"
                >
                  <ExternalLink size={14} />
                </a>
                <button
                  data-testid="close-screenshot-dialog"
                  onClick={() => setSelected(null)}
                  className="p-1.5 rounded-sm text-orbit-text-dim hover:text-orbit-text-main transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="p-2 bg-black">
              <img
                src={`${api}${selected.url}`}
                alt={selected.filename}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
