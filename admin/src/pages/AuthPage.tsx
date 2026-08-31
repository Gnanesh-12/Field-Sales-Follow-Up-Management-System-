import React, { useState } from 'react';
import { Mail, Lock, ShieldCheck, KeyRound, Sun, Moon, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[var(--bg-app)] text-[var(--text-primary)]">

      {/* Theme Toggle Button positioned fixed at top right */}
      {toggleTheme && (
        <button
          onClick={toggleTheme}
          className="fixed top-6 right-6 z-50 p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors shadow-sm cursor-pointer"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      )}

      <div className="w-full max-w-[440px] animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-[var(--border-subtle)]">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--brand-subtle)] text-[var(--brand-primary)] rounded-xl mb-4 border border-[var(--brand-subtle-border)]">
              {mode === 'change-password' ? <KeyRound size={24} /> : <ShieldCheck size={24} />}
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              {mode === 'login' && 'Admin Portal Login'}
              {mode === 'signup' && 'Create Admin Account'}
              {mode === 'change-password' && 'Change Password'}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-2 font-medium">
              {mode === 'login' && 'Sign in to access the sales command center'}
              {mode === 'signup' && 'Register your admin credentials'}
              {mode === 'change-password' && 'Enter your email, old password, and new password'}
            </p>
          </div>

          {/* Alerts */}
          {(errorMessage || successMessage) && (
            <div className="px-8 pt-6">
              {errorMessage && (
                <div className="p-3.5 bg-[var(--status-error-subtle)] border border-[var(--status-error)]/20 text-[var(--status-error)] text-sm rounded-lg font-medium flex items-start gap-3">
                  <div className="shrink-0 mt-0.5 font-bold">!</div>
                  <div>{errorMessage}</div>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 bg-[var(--status-success-subtle)] border border-[var(--status-success)]/20 text-[var(--status-success)] text-sm rounded-lg font-medium flex items-start gap-3">
                  <div className="shrink-0 mt-0.5 font-bold">✓</div>
                  <div>{successMessage}</div>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] group-focus-within:text-[var(--brand-primary)] transition-colors" size={18} />
                <input
                  type="email"
                  required
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
                />
              </div>
            </div>

            {mode === 'change-password' && (
              <div className="animate-in fade-in duration-300">
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Current Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] group-focus-within:text-[var(--brand-primary)] transition-colors" size={18} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                {mode === 'change-password' ? 'New Password' : 'Password'}
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] group-focus-within:text-[var(--brand-primary)] transition-colors" size={18} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div className="animate-in fade-in duration-300">
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] group-focus-within:text-[var(--brand-primary)] transition-colors" size={18} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="glass-button w-full py-2.5 mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                  Authenticating...
                </span>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Update Password'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Footer Actions */}
          <div className="px-8 py-5 bg-[var(--bg-surface-hover)] border-t border-[var(--border-subtle)] flex flex-col gap-3 text-center">
            {mode === 'login' ? (
              <>
                <button
                  type="button"
                  onClick={() => handleModeChange('change-password')}
                  className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  Need to change your password?
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('signup')}
                  className="text-sm font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors cursor-pointer"
                >
                  Don't have an account? Create one
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Return to Login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};