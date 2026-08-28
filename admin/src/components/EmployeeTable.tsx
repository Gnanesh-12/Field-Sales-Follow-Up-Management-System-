/*import React from 'react';
import { Trash2 } from 'lucide-react';
import { Employee } from '../types';

interface EmployeeTableProps {
  employees: Employee[];
  onDelete: (id: string) => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({ employees, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-100 border-b border-slate-200 text-xs font-semibold uppercase text-slate-600">
          <tr>
            <th className="p-4">Emp ID / Login ID</th>
            <th className="p-4">Name</th>
            <th className="p-4">Phone</th>
            <th className="p-4">Status</th>
            <th className="p-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {employees.map((emp) => (
            <tr key={emp.employee_id} className="hover:bg-slate-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-gray-900">
                {emp.id || (emp as any).employee_id || (emp as any).employeeId || '—'}
              </td>
              <td className="p-4">{emp.name}</td>
              <td className="p-4">{emp.phone || 'N/A'}</td>
              <td className="p-4">
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                  {emp.status}
                </span>
              </td>
              <td className="p-4 text-right">
                <button
                  type="button"
                  onClick={() => onDelete(emp.id)}
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
          {employees.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center p-6 text-[var(--text-main)] opacity-70">
                No employees registered yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};*/

import React from 'react';
import { Edit2, Power, Trash2 } from 'lucide-react';
import { Employee } from '../types';

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (emp: Employee) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
  onDelete: (id: string) => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  onEdit,
  onToggleStatus,
  onDelete,
}) => {
  return (
    <div className="overflow-x-auto glass-panel border-none shadow-[0_8px_32px_0_rgba(31,38,135,0.2)] mb-6">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[var(--glass-border)] bg-[var(--glass-bg-primary)] text-xs uppercase tracking-wider text-[var(--text-main)] opacity-80 font-bold">
            <th className="p-5 font-bold tracking-widest text-indigo-300">EMP ID / Login ID</th>
            <th className="p-5 font-bold tracking-widest text-indigo-300">Name</th>
            <th className="p-5 font-bold tracking-widest text-indigo-300">Phone</th>
            <th className="p-5 font-bold tracking-widest text-indigo-300">Status</th>
            <th className="p-5 text-right font-bold tracking-widest text-indigo-300">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-sm">
          {employees.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-10 text-center text-[var(--text-main)] opacity-70 font-medium">
                No matching employees found.
              </td>
            </tr>
          ) : (
            employees.map((emp) => {
              const isActive = (emp.status || 'ACTIVE').toUpperCase() === 'ACTIVE';

              return (
                <tr key={emp.id} className="hover:bg-white/10 transition-all duration-200 group">
                  <td className="p-5 font-mono font-bold text-[var(--text-main)] group-hover:text-indigo-300 transition-colors">{emp.id.toUpperCase()}</td>
                  <td className="p-5 font-bold text-[var(--text-main)] opacity-90">{emp.name}</td>
                  <td className="p-5 text-[var(--text-main)] opacity-70">{emp.phone || 'N/A'}</td>
                  <td className="p-5">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-lg ${isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/20'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-rose-500/20'
                        }`}
                    >
                      {isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="p-5 text-right space-x-3">
                    <button
                      type="button"
                      title="Edit Details"
                      onClick={() => onEdit(emp)}
                      className="p-2 rounded-xl text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white border border-indigo-500/30 transition-all duration-300 inline-flex items-center shadow-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      title={isActive ? 'Deactivate Employee' : 'Activate Employee'}
                      onClick={() => onToggleStatus(emp.id, emp.status || 'ACTIVE')}
                      className={`p-2 rounded-xl transition-all duration-300 inline-flex items-center border shadow-lg ${isActive
                          ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500 hover:text-white border-rose-500/30 shadow-rose-500/20'
                          : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border-emerald-500/30 shadow-emerald-500/20'
                        }`}
                    >
                      <Power size={16} />
                    </button>
                    <button
                      type="button"
                      title="Delete Employee"
                      onClick={() => onDelete(emp.id)}
                      className="p-2 rounded-xl text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all duration-300 inline-flex items-center shadow-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};