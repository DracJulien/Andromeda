import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Overview from './components/Dashboard/Overview';
import PropertyGrid from './components/Properties/PropertyGrid';
import LiveConsole from './components/Console/LiveConsole';
import ProofGallery from './components/Proof/ProofGallery';
import SettingsPage from './components/Settings/SettingsPage';

const API = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <Router>
      <div className="flex h-screen bg-orbit-black text-gray-100 overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header api={API} />
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<Overview api={API} />} />
              <Route path="/properties" element={<PropertyGrid api={API} />} />
              <Route path="/console" element={<LiveConsole api={API} />} />
              <Route path="/proof" element={<ProofGallery api={API} />} />
              <Route path="/settings" element={<SettingsPage api={API} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
