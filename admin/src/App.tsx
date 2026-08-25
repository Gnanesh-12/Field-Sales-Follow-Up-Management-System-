/*import React, { useState } from 'react';
import { Navigation } from './components/Navigation';
import { EmployeesPage } from './pages/EmployeesPage';
import { FieldEntriesPage } from './pages/FieldEntriesPage';
import { AuthPage } from './pages/AuthPage';

export default function App() {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<'employees' | 'entries'>('employees');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
  };

  // Auth Guard
  if (!token) {
    return <AuthPage onAuthSuccess={(newToken) => setToken(newToken)} />;
  }

  return (
    <div 
      className="min-h-screen w-full bg-slate-100 flex flex-col md:flex-row text-slate-800"
      style={{ minHeight: '100vh', width: '100vw', display: 'flex' }}
    >
      <main 
        className="flex-1 p-6 md:p-10 order-2 md:order-1 overflow-y-auto"
        style={{ flex: '1 1 0%', minWidth: 0 }}
      >
        <div className="w-full max-w-6xl mx-auto">
          {activeTab === 'employees' ? <EmployeesPage /> : <FieldEntriesPage />}
        </div>
      </main>

      <div 
        className="w-full md:w-72 shrink-0 order-1 md:order-2"
        style={{ width: '280px', flexShrink: 0 }}
      >
        <Navigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={handleLogout}
        />
      </div>
    </div>
  );
}*/

import React, { useState } from 'react';
import { Navigation } from './components/Navigation';
import { EmployeesPage } from './pages/EmployeesPage';
import { FieldEntriesPage } from './pages/FieldEntriesPage';
import { AuthPage } from './pages/AuthPage';

export default function App() {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<'employees' | 'entries'>('employees');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
  };

  // Auth Gate
  if (!token) {
    return <AuthPage onAuthSuccess={(newToken) => setToken(newToken)} />;
  }

  return (
    <div 
      className="min-h-screen w-full bg-slate-100 flex flex-col md:flex-row text-slate-800"
      style={{ minHeight: '100vh', width: '100vw', display: 'flex' }}
    >
      {/* Main Content Workspace */}
      <main 
        className="flex-1 p-6 md:p-10 order-2 md:order-1 overflow-y-auto"
        style={{ flex: '1 1 0%', minWidth: 0 }}
      >
        <div className="w-full max-w-6xl mx-auto">
          {activeTab === 'employees' ? <EmployeesPage /> : <FieldEntriesPage />}
        </div>
      </main>

      {/* Right Sidebar */}
      <div 
        className="w-full md:w-72 shrink-0 order-1 md:order-2"
        style={{ width: '280px', flexShrink: 0 }}
      >
        <Navigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={handleLogout}
        />
      </div>
    </div>
  );
}