import React, { useState } from 'react';
import { Users, FileText, BarChart3, User, Lock, LogOut, Menu, X, Sun, Moon } from 'lucide-react';

interface NavigationProps {
  activeTab: 'employees' | 'entries' | 'activity';
  setActiveTab: (tab: 'employees' | 'entries' | 'activity') => void;
  onLogout?: () => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, onLogout, isDarkMode, toggleTheme }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

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
    <div className="w-full h-full flex flex-col justify-between">
      {/* Mobile Top App Bar */}
      <div className="md:hidden flex items-center justify-between p-3 glass-panel mb-2 w-full">
        <h1 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Admin Portal</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-indigo-300 hover:text-white transition">
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Right Desktop Sidebar Panel */}
      <aside
        className={`
          ${isMobileMenuOpen ? 'block' : 'hidden'} md:flex flex-col
          w-full h-full glass-panel border-none shadow-xl
          p-4 lg:p-5 justify-between
        `}
      >
        <div>
          <div className="hidden md:block mb-6 text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-gradient mb-0.5">
              Sales Admin
            </h1>
            <div className="h-0.5 w-10 bg-indigo-500 rounded-full mx-auto mb-1.5 opacity-80"></div>
            <p className="text-[10px] text-indigo-300 font-medium tracking-wider uppercase">Field Management</p>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => {
                setActiveTab('employees');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'employees'
                  ? 'text-white shadow-md bg-indigo-500/25 border border-indigo-500/30'
                  : 'text-indigo-200/70 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <Users size={18} className={activeTab === 'employees' ? 'text-indigo-400' : 'text-indigo-300/70'} />
              <span>Employees</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('entries');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'entries'
                  ? 'text-white shadow-md bg-purple-500/25 border border-purple-500/30'
                  : 'text-indigo-200/70 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <FileText size={18} className={activeTab === 'entries' ? 'text-purple-400' : 'text-indigo-300/70'} />
              <span>Field Entries</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('activity');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'activity'
                  ? 'text-white shadow-md bg-cyan-500/25 border border-cyan-500/30'
                  : 'text-indigo-200/70 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <BarChart3 size={18} className={activeTab === 'activity' ? 'text-cyan-400' : 'text-indigo-300/70'} />
              <span>Activity & Analytics</span>
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          {/* Theme Toggle */}
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-200/80 hover:bg-white/5 border border-transparent transition cursor-pointer"
            >
              <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
              </div>
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          )}

          {/* User Profile / Menu */}
          <div className="relative">
            <button
              onClick={() => setIsAccountOpen(!isAccountOpen)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition text-left cursor-pointer"
            >
              <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 border border-indigo-500/30 shrink-0">
                <User size={16} />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{adminName}</p>
                <p className="text-[10px] text-indigo-300/60 truncate">{adminEmail}</p>
              </div>
            </button>

            {isAccountOpen && (
              <div className="absolute bottom-14 right-0 left-0 bg-[#121829]/95 backdrop-blur-xl border border-white/10 rounded-xl p-1.5 shadow-2xl space-y-1 z-30">
                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition font-semibold cursor-pointer"
                >
                  <LogOut size={14} /> Sign Out
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    window.location.reload();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-indigo-200 hover:bg-white/5 rounded-lg transition font-semibold cursor-pointer"
                >
                  <Lock size={14} /> Change Password
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};