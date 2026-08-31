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

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm(`Are you sure you want to permanently delete employee "${id.toUpperCase()}"? This action cannot be undone.`)) return;

    try {
      await apiClient.delete(`/employees/${id}`);
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to delete employee');
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
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Employee Roster</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium">Manage field sales personnel credentials & access</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="glass-button flex items-center gap-2 px-4 py-2 text-sm cursor-pointer"
        >
          <UserPlus size={16} /> <span>Add Employee</span>
        </button>
      </div>

      {/* Search & Status Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6 bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-subtle)] shadow-sm">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-tertiary)]">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search by Employee Name or EMP ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-app)] border border-[var(--border-strong)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-colors placeholder-[var(--text-tertiary)]"
          />
        </div>

        <div className="relative w-full sm:w-48 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-tertiary)]">
            <Filter size={14} />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
            className="w-full pl-9 pr-8 py-2 bg-[var(--bg-app)] border border-[var(--border-strong)] rounded-lg text-sm text-[var(--text-primary)] appearance-none cursor-pointer focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-colors"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
          {/* Custom chevron to replace default appearance-none */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[var(--text-tertiary)]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          </div>
        </div>
      </div>

      <EmployeeTable
        employees={filteredEmployees}
        onEdit={(emp) => setSelectedEmployee(emp)}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteEmployee}
      />

      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddEmployee}
        isLoading={false}
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