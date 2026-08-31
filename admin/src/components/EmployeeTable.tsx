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
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-app)]">
              <th className="py-3 px-4 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">EMP ID / Login ID</th>
              <th className="py-3 px-4 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">Name</th>
              <th className="py-3 px-4 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">Phone</th>
              <th className="py-3 px-4 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">Status</th>
              <th className="py-3 px-4 text-right font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[var(--text-tertiary)] text-sm font-medium border-t border-dashed border-[var(--border-subtle)]">
                  No matching employees found.
                </td>
              </tr>
            ) : (
              employees.map((emp) => {
                const isActive = (emp.status || 'ACTIVE').toUpperCase() === 'ACTIVE';

                return (
                  <tr key={emp.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors group">
                    <td className="py-3 px-4 font-mono font-medium text-[var(--text-primary)] text-xs">{emp.id.toUpperCase()}</td>
                    <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">{emp.name}</td>
                    <td className="py-3 px-4 text-[var(--text-secondary)]">{emp.phone || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${isActive
                            ? 'bg-[var(--status-success-subtle)] text-[var(--status-success)] border-[var(--status-success-subtle)]'
                            : 'bg-[var(--status-error-subtle)] text-[var(--status-error)] border-[var(--status-error-subtle)]'
                          }`}
                      >
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        type="button"
                        title="Edit Details"
                        onClick={() => onEdit(emp)}
                        className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-subtle)] transition-colors inline-flex items-center cursor-pointer"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        title={isActive ? 'Deactivate Employee' : 'Activate Employee'}
                        onClick={() => onToggleStatus(emp.id, emp.status || 'ACTIVE')}
                        className={`p-1.5 rounded-md transition-colors inline-flex items-center cursor-pointer ${isActive
                            ? 'text-[var(--text-secondary)] hover:text-[var(--status-error)] hover:bg-[var(--status-error-subtle)]'
                            : 'text-[var(--text-secondary)] hover:text-[var(--status-success)] hover:bg-[var(--status-success-subtle)]'
                          }`}
                      >
                        <Power size={16} />
                      </button>
                      <button
                        type="button"
                        title="Delete Employee"
                        onClick={() => onDelete(emp.id)}
                        className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--status-error)] hover:bg-[var(--status-error-subtle)] transition-colors inline-flex items-center cursor-pointer"
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
    </div>
  );
};