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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-[var(--bg-surface)] border border-[var(--border-strong)] w-full max-w-md rounded-xl overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-app)]">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Edit Employee: <span className="text-[var(--text-secondary)] font-mono text-sm ml-1">{employee.id}</span></h3>
          <button onClick={onClose} className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-app)] border border-[var(--border-strong)] rounded-md text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-app)] border border-[var(--border-strong)] rounded-md text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              New Password <span className="text-[var(--text-tertiary)] normal-case ml-1 font-medium">(leave blank to keep)</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-app)] border border-[var(--border-strong)] rounded-md text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all placeholder-[var(--text-tertiary)]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-[var(--border-subtle)] mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-md text-sm font-semibold transition-colors cursor-pointer shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};