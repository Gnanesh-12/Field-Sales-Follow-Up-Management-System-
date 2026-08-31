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