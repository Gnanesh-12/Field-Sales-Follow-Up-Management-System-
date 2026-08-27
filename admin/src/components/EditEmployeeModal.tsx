import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Employee } from '../types';

interface EditEmployeeModalProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSubmit: (id: string, data: { name: string; phone?: string; password?: string }) => void;
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  isOpen,
  employee,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (employee) {
      setName(employee.name || '');
      setPhone(employee.phone || '');
      setPassword('');
    }
  }, [employee]);

  if (!isOpen || !employee) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(employee.id, {
      name,
      phone,
      ...(password ? { password } : {}),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 shadow-[0_0_50px_0_rgba(99,102,241,0.2)]">
        <div className="flex justify-between items-center px-6 py-5 border-b border-[var(--glass-border)] bg-[var(--glass-bg-primary)]">
          <h3 className="text-xl font-extrabold heading-gradient tracking-tight">Edit Employee: {employee.id}</h3>
          <button onClick={onClose} className="p-2 rounded-xl text-[var(--text-main)] opacity-70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-[var(--text-main)] opacity-70 uppercase tracking-wider mb-2">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input w-full px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-main)] opacity-70 uppercase tracking-wider mb-2">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="glass-input w-full px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-main)] opacity-70 uppercase tracking-wider mb-2">
              New Password <span className="text-slate-500 font-medium normal-case ml-1">(leave blank to keep unchanged)</span>
            </label>
            <input
              type="password"
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};