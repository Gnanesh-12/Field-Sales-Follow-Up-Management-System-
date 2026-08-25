import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Filter } from 'lucide-react';
import { apiClient } from '../api';
import { Employee, AddEmployeeForm } from '../types';
import { EmployeeTable } from '../components/EmployeeTable';
import { AddEmployeeModal } from '../components/AddEmployeeModal';
import { EditEmployeeModal } from '../components/EditEmployeeModal';

export const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const fetchEmployees = async () => {
    try {
      const res = await apiClient.get<Employee[]>('/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (form: AddEmployeeForm) => {
    try {
      await apiClient.post('/employees', form);
      setIsAddModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to add employee');
    }
  };

  const handleEditEmployee = async (id: string, data: { name: string; phone?: string; password?: string }) => {
    try {
      await apiClient.patch(`/employees/${id}`, data);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to update employee');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus.toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (!confirm(`Are you sure you want to change this employee's status to ${nextStatus}?`)) return;

    try {
      await apiClient.patch(`/employees/${id}/status`, { status: nextStatus });
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to update status');
    }
  };

  // Combined Search and Status filtering
  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      emp.name.toLowerCase().includes(q) || emp.id.toLowerCase().includes(q);

    const empStatus = (emp.status || 'ACTIVE').toUpperCase();
    const matchesStatus =
      statusFilter === 'ALL' ? true : empStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Employee Roster</h2>
          <p className="text-sm text-slate-500">Manage field sales personnel credentials & access</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition"
        >
          <UserPlus size={18} /> Add Employee
        </button>
      </div>

      {/* Search & Status Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by Employee Name or EMP ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
              className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      <EmployeeTable
        employees={filteredEmployees}
        onEdit={(emp) => setSelectedEmployee(emp)}
        onToggleStatus={handleToggleStatus}
      />

      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddEmployee}
      />

      <EditEmployeeModal
        isOpen={!!selectedEmployee}
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        onSubmit={handleEditEmployee}
      />
    </div>
  );
};