import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, UserPlus, LogIn, KeyRound } from 'lucide-react';
import { apiClient } from '../api';

interface AuthPageProps {
  onAuthSuccess?: (token: string, user: any) => void;
}

type AuthMode = 'login' | 'signup' | 'change-password';

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6 text-slate-900">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-8 py-7 text-white text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600/20 text-blue-400 rounded-xl mb-3 border border-blue-500/30">
            {mode === 'change-password' ? <KeyRound size={26} /> : <ShieldCheck size={26} />}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            {mode === 'login' && 'Admin Portal Login'}
            {mode === 'signup' && 'Create Admin Account'}
            {mode === 'change-password' && 'Change Password'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            {mode === 'login' && 'Sign in with your email and password'}
            {mode === 'signup' && 'Register your admin credentials'}
            {mode === 'change-password' && 'Enter your email, old password, and new password'}
          </p>
        </div>

        {/* Alerts */}
        <div className="px-8 pt-6">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl font-semibold">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl font-semibold">
              {successMessage}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
              <input
                type="email"
                required
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 font-medium rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Current Password (Change Password mode only) */}
          {mode === 'change-password' && (
            <div className="animate-in fade-in duration-150">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 font-medium rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                />
              </div>
            </div>
          )}

          {/* New Password / Password */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              {mode === 'change-password' ? 'New Password' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 font-medium rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Sign-up only) */}
          {mode === 'signup' && (
            <div className="animate-in fade-in duration-150">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 font-medium rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              'Processing...'
            ) : mode === 'signup' ? (
              <>
                <UserPlus size={16} /> Create Account
              </>
            ) : mode === 'change-password' ? (
              <>
                <KeyRound size={16} /> Update Password
              </>
            ) : (
              <>
                <LogIn size={16} /> Sign In <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation Links */}
        <div className="bg-slate-50 border-t border-slate-200 px-8 py-4 text-center text-xs text-slate-700 space-y-2">
          {mode === 'login' && (
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => handleModeChange('change-password')}
                className="text-blue-700 font-bold hover:underline cursor-pointer"
              >
                Change password?
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('signup')}
                className="text-blue-700 font-bold hover:underline cursor-pointer"
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
                className="text-blue-700 font-bold hover:underline cursor-pointer ml-1"
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
                className="text-blue-700 font-bold hover:underline cursor-pointer ml-1"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};