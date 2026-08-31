import { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { EmployeesPage } from './pages/EmployeesPage';
import { FieldEntriesPage } from './pages/FieldEntriesPage';
import { EmployeeActivityPage } from './pages/EmployeeActivityPage';
import { AuthPage } from './pages/AuthPage';

export default function App() {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<'employees' | 'entries' | 'activity'>('activity');

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
  };

  if (!token) {
    return <AuthPage onAuthSuccess={(newToken) => setToken(newToken)} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-app)]">
      {/* Left Sidebar */}
      <div className="hidden md:flex md:w-64 lg:w-72 h-full shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
      </div>

      {/* Main Workspace */}
      <main className="flex-1 h-full overflow-y-auto min-w-0 bg-[var(--bg-app)] relative flex flex-col">
        {/* Mobile Header and Nav inside Navigation component, we can render it here for mobile */}
        <div className="md:hidden">
          <Navigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLogout={handleLogout}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
          />
        </div>
        
        <div className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto">
          {activeTab === 'employees' && <EmployeesPage />}
          {activeTab === 'entries' && <FieldEntriesPage />}
          {activeTab === 'activity' && <EmployeeActivityPage />}
        </div>
      </main>
    </div>
  );
}