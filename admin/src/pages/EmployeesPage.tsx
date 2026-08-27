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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold heading-gradient tracking-tight">Employee Roster</h2>
          <p className="text-sm subtitle-text mt-1 font-medium">Manage field sales personnel credentials & access</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="glass-button flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all"
        >
          <UserPlus size={18} /> <span>Add Employee</span>
        </button>
      </div>

      {/* Search & Status Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
        <div className="relative flex-1 w-full group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-300 group-focus-within:text-indigo-400 transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search by Employee Name or EMP ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full pl-12 pr-4 py-3"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-300 group-focus-within:text-indigo-400 transition-colors">
            <Filter size={16} />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
            className="glass-input w-full sm:w-48 pl-10 pr-8 py-3 appearance-none cursor-pointer"
          >
            <option value="ALL" className="bg-[var(--glass-bg-primary)] text-[var(--text-main)]">All Statuses</option>
            <option value="ACTIVE" className="bg-[var(--glass-bg-primary)] text-[var(--text-main)]">Active Only</option>
            <option value="INACTIVE" className="bg-[var(--glass-bg-primary)] text-[var(--text-main)]">Inactive Only</option>
          </select>
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