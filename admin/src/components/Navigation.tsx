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

  const navItems = [
    { id: 'activity', label: 'Sales Operations', icon: BarChart3 },
    { id: 'employees', label: 'Employee Roster', icon: Users },
    { id: 'entries', label: 'Field Entries', icon: FileText },
  ] as const;

  return (
    <div className="w-full h-full flex flex-col justify-between">
      {/* Mobile Top App Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] w-full sticky top-0 z-50">
        <h1 className="text-lg font-bold text-[var(--text-primary)]">Admin Portal</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Panel */}
      <aside
        className={`
          ${isMobileMenuOpen ? 'flex absolute inset-0 z-40 bg-[var(--bg-surface)]' : 'hidden'} md:flex flex-col
          w-full h-full p-4 lg:p-6 justify-between overflow-y-auto
        `}
      >
        <div>
          <div className="hidden md:flex items-center gap-3 mb-8 px-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              S
            </div>
            <div>
              <h1 className="text-sm font-bold text-[var(--text-primary)] leading-none">Sales Admin</h1>
              <p className="text-[11px] text-[var(--text-tertiary)] font-medium mt-1 uppercase tracking-wider">Field Operations</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[var(--brand-subtle)] text-[var(--brand-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-[var(--brand-primary)]' : 'text-[var(--text-tertiary)]'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 mt-8 border-t border-[var(--border-subtle)] space-y-2">
          {/* Theme Toggle */}
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
            >
              <div className="text-[var(--text-tertiary)]">
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </div>
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          )}

          {/* User Profile / Menu */}
          <div className="relative mt-2">
            <button
              onClick={() => setIsAccountOpen(!isAccountOpen)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
                <User size={16} />
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{adminName}</p>
                <p className="text-xs text-[var(--text-tertiary)] truncate">{adminEmail}</p>
              </div>
            </button>

            {isAccountOpen && (
              <div className="absolute bottom-14 left-0 w-full bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg p-1.5 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--status-error)] hover:bg-[var(--status-error-subtle)] rounded-md transition-colors font-medium cursor-pointer"
                >
                  <LogOut size={16} /> Sign Out
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    window.location.reload();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-md transition-colors font-medium cursor-pointer"
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