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

  const [activeTab, setActiveTab] = useState<'employees' | 'entries' | 'activity'>('employees');

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
    <div className="relative h-screen w-screen flex flex-col md:flex-row overflow-hidden font-sans bg-[#0b0f19]">
      {/* Background Blobs */}
      <div className="bg-blob bg-indigo-600/25 w-80 h-80 rounded-full top-[-10%] left-[-10%] pointer-events-none"></div>
      <div className="bg-blob bg-purple-600/25 w-96 h-96 rounded-full bottom-[-10%] right-[-10%] pointer-events-none" style={{ animationDelay: '2s' }}></div>

      {/* Main Workspace (Scrolls smoothly inside its own container) */}
      <main className="flex-1 h-full p-3 md:p-5 order-2 md:order-1 overflow-y-auto min-w-0">
        <div className="w-full max-w-6xl mx-auto glass-panel p-4 md:p-6 min-h-full">
          {activeTab === 'employees' && <EmployeesPage />}
          {activeTab === 'entries' && <FieldEntriesPage />}
          {activeTab === 'activity' && <EmployeeActivityPage />}
        </div>
      </main>

      {/* Right Sidebar (Responsive width for 14-inch screens) */}
      <div className="w-full md:w-64 lg:w-72 h-full shrink-0 order-1 md:order-2 p-3 md:p-5 pl-0">
        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
      </div>
    </div>
  );
}