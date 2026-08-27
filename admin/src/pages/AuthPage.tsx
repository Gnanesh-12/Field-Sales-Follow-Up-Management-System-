import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, UserPlus, LogIn, KeyRound, Sun, Moon } from 'lucide-react';
import { apiClient } from '../api';

interface AuthPageProps {
  onAuthSuccess?: (token: string, user: any) => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

type AuthMode = 'login' | 'signup' | 'change-password';

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess, isDarkMode, toggleTheme }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const resetMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    resetMessages();
    setPassword('');
    setConfirmPassword('');
    setOldPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (mode === 'change-password') {
      if (!oldPassword || !password) {
        setErrorMessage('Please enter your current and new password.');
        return;
      }
    } else if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your confirmation password.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'change-password') {
        const res = await apiClient.patch('/auth/change-password', {
          email,
          oldPassword,
          newPassword: password,
        });
        setSuccessMessage(res.data.message || 'Password changed successfully! You can now log in.');
        setTimeout(() => handleModeChange('login'), 1500);
        return;
      }

      const endpoint = mode === 'signup' ? '/auth/register' : '/auth/login';
      const payload = mode === 'signup'
        ? { email, password, confirmPassword }
        : { email, password };

      const res = await apiClient.post(endpoint, payload);
      const token = res.data.token || res.data.access_token;

      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }

      setSuccessMessage(mode === 'signup' ? 'Account created successfully!' : 'Welcome back!');

      setTimeout(() => {
        if (onAuthSuccess) {
          onAuthSuccess(token, res.data.user);
        } else {
          window.location.reload();
        }
      }, 500);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Authentication failed. Please check your details.';
      setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden font-sans">
      {/* Background Animated Blobs */}
      <div className="bg-blob bg-indigo-600/30 w-[40rem] h-[40rem] rounded-full top-[-20%] left-[-10%]"></div>
      <div className="bg-blob bg-purple-600/30 w-[35rem] h-[35rem] rounded-full bottom-[-10%] right-[-10%]" style={{ animationDelay: '2s' }}></div>

      {/* Theme Toggle Button positioned fixed at top right */}
      {toggleTheme && (
        <button
          onClick={toggleTheme}
          className="fixed top-6 right-6 z-50 p-3 rounded-2xl glass-panel text-[var(--text-main)] opacity-80 hover:text-white transition-all shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 cursor-pointer"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-400" />}
        </button>
      )}

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="glass-panel overflow-hidden">
          {/* Header */}
          <div className="px-8 py-8 text-center border-b border-[var(--glass-border)] relative overflow-hidden bg-[var(--glass-bg-primary)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500"></div>
            <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl mb-4 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              {mode === 'change-password' ? <KeyRound size={28} /> : <ShieldCheck size={28} />}
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight heading-gradient">
              {mode === 'login' && 'Admin Portal Login'}
              {mode === 'signup' && 'Create Admin Account'}
              {mode === 'change-password' && 'Change Password'}
            </h2>
            <p className="text-sm subtitle-text mt-2 font-medium">
              {mode === 'login' && 'Sign in with your email and password'}
              {mode === 'signup' && 'Register your admin credentials'}
              {mode === 'change-password' && 'Enter your email, old password, and new password'}
            </p>
          </div>

          {/* Alerts */}
          {(errorMessage || successMessage) && (
            <div className="px-8 pt-6">
              {errorMessage && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm rounded-xl font-bold shadow-inner flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">⚠️</div>
                  <div>{errorMessage}</div>
                </div>
              )}

              {successMessage && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-xl font-bold shadow-inner flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">✓</div>
                  <div>{successMessage}</div>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-main)] opacity-70 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input
                  type="email"
                  required
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full pl-11 pr-4 py-3"
                />
              </div>
            </div>

            {/* Current Password (Change Password mode only) */}
            {mode === 'change-password' && (
              <div className="animate-in fade-in duration-300 slide-in-from-top-2">
                <label className="block text-xs font-bold text-[var(--text-main)] opacity-70 uppercase tracking-wider mb-2">
                  Current Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="glass-input w-full pl-11 pr-11 py-3"
                  />
                </div>
              </div>
            )}

            {/* New Password / Password */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-main)] opacity-70 uppercase tracking-wider mb-2">
                {mode === 'change-password' ? 'New Password' : 'Password'}
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full pl-11 pr-11 py-3"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Sign-up only) */}
            {mode === 'signup' && (
              <div className="animate-in fade-in duration-300 slide-in-from-top-2">
                <label className="block text-xs font-bold text-[var(--text-main)] opacity-70 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="glass-input w-full pl-11 pr-4 py-3"
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="glass-button w-full flex items-center justify-center gap-2 py-3.5 px-4 text-sm font-bold rounded-xl shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[var(--text-main)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : mode === 'signup' ? (
                  <>
                    <UserPlus size={18} /> Create Account
                  </>
                ) : mode === 'change-password' ? (
                  <>
                    <KeyRound size={18} /> Update Password
                  </>
                ) : (
                  <>
                    <LogIn size={18} /> Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Navigation Links */}
          <div className="bg-[var(--glass-bg-primary)]/40 border-t border-[var(--glass-border)] px-8 py-5 text-center text-sm font-medium text-[var(--text-main)] opacity-70 space-y-3">
            {mode === 'login' && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleModeChange('change-password')}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  Change password?
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('signup')}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  Create account
                </button>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer ml-1"
                >
                  Sign In
                </button>
              </div>
            )}

            {mode === 'change-password' && (
              <div>
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer ml-1"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};