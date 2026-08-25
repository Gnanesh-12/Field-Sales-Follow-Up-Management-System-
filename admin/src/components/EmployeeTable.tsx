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
              <td colSpan={5} className="text-center p-6 text-slate-400">
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
import { Edit2, Power } from 'lucide-react';
import { Employee } from '../types';

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (emp: Employee) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  onEdit,
  onToggleStatus,
}) => {
  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 font-semibold">
            <th className="p-4">EMP ID / Login ID</th>
            <th className="p-4">Name</th>
            <th className="p-4">Phone</th>
            <th className="p-4">Status</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-sm">
          {employees.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-6 text-center text-gray-400">
                No matching employees found.
              </td>
            </tr>
          ) : (
            employees.map((emp) => {
              const isActive = (emp.status || 'ACTIVE').toUpperCase() === 'ACTIVE';

              return (
                <tr key={emp.id} className="hover:bg-gray-50/80 transition">
                  <td className="p-4 font-mono font-bold text-gray-900">{emp.id}</td>
                  <td className="p-4 font-medium text-gray-800">{emp.name}</td>
                  <td className="p-4 text-gray-500">{emp.phone || 'N/A'}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      type="button"
                      title="Edit Details"
                      onClick={() => onEdit(emp)}
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition inline-flex items-center"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      title={isActive ? 'Deactivate Employee' : 'Activate Employee'}
                      onClick={() => onToggleStatus(emp.id, emp.status || 'ACTIVE')}
                      className={`p-1.5 rounded-lg transition inline-flex items-center ${
                        isActive
                          ? 'text-amber-600 hover:bg-amber-50'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      <Power size={16} />
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