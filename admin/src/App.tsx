/*
import { useState, useEffect } from 'react';
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

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true; // Default to dark
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

  // Auth Gate
  if (!token) {
    return <AuthPage onAuthSuccess={(newToken) => setToken(newToken)} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col md:flex-row overflow-hidden font-sans">
      
      <div className="bg-blob bg-indigo-600/30 w-96 h-96 rounded-full top-[-10%] left-[-10%]"></div>
      <div className="bg-blob bg-purple-600/30 w-[30rem] h-[30rem] rounded-full bottom-[-10%] right-[-10%]" style={{ animationDelay: '2s' }}></div>
      <div className="bg-blob bg-cyan-600/20 w-80 h-80 rounded-full top-[40%] left-[60%]" style={{ animationDelay: '4s' }}></div>

      
      <main
        className="flex-1 p-4 md:p-8 order-2 md:order-1 overflow-y-auto relative z-10"
        style={{ flex: '1 1 0%', minWidth: 0 }}
      >
        <div className="w-full max-w-6xl mx-auto glass-panel p-6 min-h-[calc(100vh-4rem)]">
          {activeTab === 'employees' ? <EmployeesPage /> : <FieldEntriesPage />}
        </div>
      </main>

      
      <div
        className="w-full md:w-80 shrink-0 order-1 md:order-2 relative z-20"
        style={{ flexShrink: 0 }}
      >
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
*/
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
    return savedTheme ? savedTheme === 'dark' : true; // Default to dark
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

  // Auth Gate
  if (!token) {
    return <AuthPage onAuthSuccess={(newToken) => setToken(newToken)} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Background Animated Blobs */}
      <div className="bg-blob bg-indigo-600/30 w-96 h-96 rounded-full top-[-10%] left-[-10%]"></div>
      <div className="bg-blob bg-purple-600/30 w-[30rem] h-[30rem] rounded-full bottom-[-10%] right-[-10%]" style={{ animationDelay: '2s' }}></div>
      <div className="bg-blob bg-cyan-600/20 w-80 h-80 rounded-full top-[40%] left-[60%]" style={{ animationDelay: '4s' }}></div>

      {/* Main Content Workspace */}
      <main
        className="flex-1 p-4 md:p-8 order-2 md:order-1 overflow-y-auto relative z-10"
        style={{ flex: '1 1 0%', minWidth: 0 }}
      >
        <div className="w-full max-w-6xl mx-auto glass-panel p-6 min-h-[calc(100vh-4rem)]">
          {activeTab === 'employees' && <EmployeesPage />}
          {activeTab === 'entries' && <FieldEntriesPage />}
          {activeTab === 'activity' && <EmployeeActivityPage />}
        </div>
      </main>

      {/* Right Sidebar */}
      <div
        className="w-full md:w-80 shrink-0 order-1 md:order-2 relative z-20"
        style={{ flexShrink: 0 }}
      >
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