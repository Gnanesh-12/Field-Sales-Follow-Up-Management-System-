/*import React, { useState } from 'react';
import { Users, FileText, User, Lock, LogOut, Menu, X } from 'lucide-react';

interface NavigationProps {
  activeTab: 'employees' | 'entries';
  setActiveTab: (tab: 'employees' | 'entries') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  return (
    <div className="w-full h-full">

      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white w-full">
        <h1 className="text-lg font-bold">Admin Portal</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

    
      <aside
        className={`
          ${isMobileMenuOpen ? 'block' : 'hidden'} md:flex flex-col
          w-full h-full bg-slate-900 text-slate-200 border-l border-slate-800
          p-6 justify-between min-h-screen
        `}
      >
        <div>
          <div className="hidden md:block mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight">Sales Admin</h1>
            <p className="text-xs text-slate-400 mt-1">Field Management Portal</p>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => {
                setActiveTab('employees');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'employees'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Users size={18} /> Employees
            </button>
            <button
              onClick={() => {
                setActiveTab('entries');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'entries'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <FileText size={18} /> Field Entries & Approval
            </button>
          </nav>
        </div>

       
        <div className="relative pt-6 border-t border-slate-800 mt-6">
          <button
            onClick={() => setIsAccountOpen(!isAccountOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-full text-blue-400 border border-slate-700">
                <User size={18} />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">Admin Account</p>
                <p className="text-xs text-slate-400 truncate">admin@company.com</p>
              </div>
            </div>
          </button>

          {isAccountOpen && (
            <div className="absolute bottom-20 right-0 left-0 bg-slate-800 border border-slate-700 rounded-xl p-2 shadow-2xl space-y-1 z-30">
              <button
                disabled
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-500 cursor-not-allowed rounded-lg"
              >
                <Lock size={14} /> Change Password (Off)
              </button>
              <button
                disabled
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-500 cursor-not-allowed rounded-lg"
              >
                <LogOut size={14} /> Logout (Off)
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
*/

import React, { useState } from 'react';
import { Users, FileText, User, Lock, LogOut, Menu, X } from 'lucide-react';

interface NavigationProps {
  activeTab: 'employees' | 'entries';
  setActiveTab: (tab: 'employees' | 'entries') => void;
  onLogout?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  // Retrieve logged-in user profile from localStorage if present
  const user = (() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const adminName = user?.name || 'Admin Account';
  const adminEmail = user?.email || user?.id || 'admin@company.com';

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
  };

  return (
    <div className="w-full h-full">
      {/* Mobile Top App Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white w-full">
        <h1 className="text-lg font-bold">Admin Portal</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Right Desktop Sidebar */}
      <aside
        className={`
          ${isMobileMenuOpen ? 'block' : 'hidden'} md:flex flex-col
          w-full h-full bg-slate-900 text-slate-200 border-l border-slate-800
          p-6 justify-between min-h-screen
        `}
      >
        <div>
          <div className="hidden md:block mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight">Sales Admin</h1>
            <p className="text-xs text-slate-400 mt-1">Field Management Portal</p>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => {
                setActiveTab('employees');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${
                activeTab === 'employees'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Users size={18} /> Employees
            </button>
            <button
              onClick={() => {
                setActiveTab('entries');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${
                activeTab === 'entries'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <FileText size={18} /> Field Entries & Approval
            </button>
          </nav>
        </div>

        {/* Account Menu Section */}
        <div className="relative pt-6 border-t border-slate-800 mt-6">
          <button
            onClick={() => setIsAccountOpen(!isAccountOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 bg-slate-800 rounded-full text-blue-400 border border-slate-700 shrink-0">
                <User size={18} />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{adminName}</p>
                <p className="text-xs text-slate-400 truncate">{adminEmail}</p>
              </div>
            </div>
          </button>

          {isAccountOpen && (
            <div className="absolute bottom-20 right-0 left-0 bg-slate-800 border border-slate-700 rounded-xl p-2 shadow-2xl space-y-1 z-30 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer font-medium"
              >
                <LogOut size={14} /> Sign Out
              </button>
              
              {/* Change password action */}

              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.reload();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 rounded-lg transition cursor-pointer font-medium"
              >
                <Lock size={14} /> Change Password
              </button>            

            </div>
          )}
        </div>
      </aside>
    </div>
  );
};