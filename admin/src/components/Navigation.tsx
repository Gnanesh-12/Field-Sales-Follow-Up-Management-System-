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

      <div className="md:hidden flex items-center justify-between p-4 bg-[var(--glass-bg-primary)] text-[var(--text-main)] w-full">
        <h1 className="text-lg font-bold">Admin Portal</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

    
      <aside
        className={`
          ${isMobileMenuOpen ? 'block' : 'hidden'} md:flex flex-col
          w-full h-full bg-[var(--glass-bg-primary)] text-[var(--text-main)] opacity-90 border-l border-[var(--glass-border)]
          p-6 justify-between min-h-screen
        `}
      >
        <div>
          <div className="hidden md:block mb-8">
            <h1 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">Sales Admin</h1>
            <p className="text-xs text-[var(--text-main)] opacity-70 mt-1">Field Management Portal</p>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => {
                setActiveTab('employees');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'employees'
                  ? 'bg-blue-600 text-[var(--text-main)] shadow-md'
                  : 'hover:bg-slate-800 text-[var(--text-main)] opacity-80'
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
                  ? 'bg-blue-600 text-[var(--text-main)] shadow-md'
                  : 'hover:bg-slate-800 text-[var(--text-main)] opacity-80'
              }`}
            >
              <FileText size={18} /> Field Entries & Approval
            </button>
          </nav>
        </div>

       
        <div className="relative pt-6 border-t border-[var(--glass-border)] mt-6">
          <button
            onClick={() => setIsAccountOpen(!isAccountOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--glass-bg-primary)] rounded-full text-blue-400 border border-[var(--glass-border)]">
                <User size={18} />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-[var(--text-main)] truncate">Admin Account</p>
                <p className="text-xs text-[var(--text-main)] opacity-70 truncate">admin@company.com</p>
              </div>
            </div>
          </button>

          {isAccountOpen && (
            <div className="absolute bottom-20 right-0 left-0 bg-[var(--glass-bg-primary)] border border-[var(--glass-border)] rounded-xl p-2 shadow-2xl space-y-1 z-30">
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
import { Users, FileText, User, Lock, LogOut, Menu, X, Sun, Moon } from 'lucide-react';

interface NavigationProps {
  activeTab: 'employees' | 'entries';
  setActiveTab: (tab: 'employees' | 'entries') => void;
  onLogout?: () => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, onLogout, isDarkMode, toggleTheme }) => {
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
    <div className="w-full h-full p-4 md:p-8 pl-0">
      {/* Mobile Top App Bar */}
      <div className="md:hidden flex items-center justify-between p-4 glass-panel mb-4 w-full">
        <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Admin Portal</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-indigo-300 hover:text-white transition">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Right Desktop Sidebar */}
      <aside
        className={`
          ${isMobileMenuOpen ? 'block' : 'hidden'} md:flex flex-col
          w-full h-full glass-panel border-none shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
          p-6 justify-between min-h-[calc(100vh-4rem)]
        `}
      >
        <div>
          <div className="hidden md:block mb-10 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-gradient mb-1">
              Sales Admin
            </h1>
            <div className="h-1 w-12 bg-indigo-500 rounded-full mx-auto mb-2 opacity-80"></div>
            <p className="text-xs text-indigo-300 font-medium tracking-wide uppercase">Field Management</p>
          </div>

          <nav className="space-y-3">
            <button
              onClick={() => {
                setActiveTab('employees');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 cursor-pointer overflow-hidden relative group ${activeTab === 'employees'
                  ? 'text-[var(--text-main)] shadow-lg shadow-indigo-500/20 bg-indigo-500/20 border border-indigo-500/30'
                  : 'text-[var(--text-main)] opacity-80 hover:bg-white/5 border border-transparent'
                }`}
            >
              {activeTab === 'employees' && <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 animate-pulse"></div>}
              <Users size={20} className={activeTab === 'employees' ? 'text-indigo-400 relative z-10' : 'text-[var(--text-main)] opacity-70 group-hover:text-indigo-400 transition-colors relative z-10'} />
              <span className="relative z-10">Employees</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('entries');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 cursor-pointer overflow-hidden relative group ${activeTab === 'entries'
                  ? 'text-[var(--text-main)] shadow-lg shadow-purple-500/20 bg-purple-500/20 border border-purple-500/30'
                  : 'text-[var(--text-main)] opacity-80 hover:bg-white/5 border border-transparent'
                }`}
            >
              {activeTab === 'entries' && <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 animate-pulse"></div>}
              <FileText size={20} className={activeTab === 'entries' ? 'text-purple-400 relative z-10' : 'text-[var(--text-main)] opacity-70 group-hover:text-purple-400 transition-colors relative z-10'} />
              <span className="relative z-10">Field Entries</span>
            </button>
          </nav>
        </div>

        {/* Bottom Section */}
        <div>
          {/* Theme Toggle */}
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-4 px-5 py-3.5 mb-2 rounded-2xl text-sm font-bold transition-all duration-300 cursor-pointer text-[var(--text-main)] opacity-80 hover:bg-white/5 border border-transparent hover:border-white/10"
            >
              <div className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </div>
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          )}

          {/* Account Menu Section */}
          <div className="relative pt-4 border-t border-[var(--glass-border)]">
            <button
              onClick={() => setIsAccountOpen(!isAccountOpen)}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-all text-left cursor-pointer group border border-transparent hover:border-white/10"
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400 border border-indigo-500/30 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <User size={20} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-[var(--text-main)] truncate">{adminName}</p>
                  <p className="text-xs text-indigo-300/70 truncate">{adminEmail}</p>
                </div>
              </div>
            </button>

            {isAccountOpen && (
              <div className="absolute bottom-20 right-0 left-0 bg-[var(--glass-bg-primary)]/90 backdrop-blur-xl border border-[var(--glass-border)] rounded-2xl p-2 shadow-2xl space-y-1 z-30 animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer font-bold"
                >
                  <LogOut size={16} /> Sign Out
                </button>

                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    window.location.reload();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-main)] opacity-80 hover:bg-white/10 rounded-xl transition cursor-pointer font-bold"
                >
                  <Lock size={16} /> Change Password
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};