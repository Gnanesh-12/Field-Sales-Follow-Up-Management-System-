import React, { useState } from 'react';
import { X } from 'lucide-react';
import { AddEmployeeForm } from '../types';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: AddEmployeeForm) => void;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedId = employeeId.trim().toLowerCase();
    const idRegex = /^[a-z]{2}-[a-z]{2}-\d{3}$/;

    if (!idRegex.test(formattedId)) {
      setError('Format must match: se-fs-001 (2 letters - 2 letters - 3 digits)');
      return;
    }

    setError('');
    onSubmit({
      employeeId: formattedId,
      name,
      phone,
      password,
    });

    setEmployeeId('');
    setName('');
    setPhone('');
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 shadow-[0_0_50px_0_rgba(99,102,241,0.2)]">
        <div className="flex justify-between items-center px-6 py-5 border-b border-[var(--glass-border)] bg-[var(--glass-bg-primary)]">
          <h3 className="text-xl font-extrabold heading-gradient tracking-tight">Add New Employee</h3>
          <button onClick={onClose} className="p-2 rounded-xl text-[var(--text-main)] opacity-70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-4 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl font-medium shadow-inner">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[var(--text-main)] opacity-70 uppercase tracking-wider mb-2">
              Employee ID <span className="text-slate-500 font-medium normal-case ml-1">(Format: se-fs-001)</span>
            </label>
            <input
              type="text"
              required
              placeholder="se-fs-001"
              value={employeeId}
              onChange={(e) => {
                setEmployeeId(e.target.value);
                if (error) setError('');
              }}
              pattern="^[a-zA-Z]{2}-[a-zA-Z]{2}-\d{3}$"
              title="Must be 4 letters and 3 digits with hyphens (e.g. se-fs-001)"
              className="glass-input w-full font-mono px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-main)] opacity-70 uppercase tracking-wider mb-2">Full Name</label>
            <input
              type="text"
              required
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input w-full px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-main)] opacity-70 uppercase tracking-wider mb-2">Phone Number</label>
            <input
              type="text"
              placeholder="+91 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="glass-input w-full px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-main)] opacity-70 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input w-full px-4 py-3"
            />
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-[var(--glass-border)] mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-[var(--text-main)] opacity-80 hover:text-white bg-[var(--glass-bg-primary)]/50 hover:bg-slate-700/50 border border-[var(--glass-border)]/50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="glass-button px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg cursor-pointer"
            >
              Add Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};