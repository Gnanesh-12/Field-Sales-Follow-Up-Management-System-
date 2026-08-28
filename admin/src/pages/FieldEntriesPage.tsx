import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  RotateCcw,
  Download,
  Radio,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '../api';
import { FieldEntry } from '../types';
import { FieldEntryCard } from '../components/FieldEntryCard';

type SortField = 'date' | 'empId' | 'name' | 'location' | 'status';
type SortOrder = 'asc' | 'desc';

export const FieldEntriesPage: React.FC = () => {
  const [entries, setEntries] = useState<FieldEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Date filter states
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');

  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Real-time Auto-Sync State
  const [isAutoSync, setIsAutoSync] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const isFetchingRef = useRef(false);

  const fetchEntries = async (isBackground = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!isBackground) setIsFetching(true);

    try {
      const res = await apiClient.get<FieldEntry[]>('/field-entries');
      setEntries(res.data);
    } catch (err) {
      console.error('Failed to load field entries:', err);
    } finally {
      isFetchingRef.current = false;
      setIsFetching(false);
    }
  };

  // 1. Initial Fetch
  useEffect(() => {
    fetchEntries();
  }, []);

  // 2. Real-Time Auto-Polling (Pulls new DB additions every 3 seconds)
  useEffect(() => {
    if (!isAutoSync) return;

    const intervalId = setInterval(() => {
      fetchEntries(true);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [isAutoSync]);

  const handleStatusUpdate = async (id: any, status: 'APPROVED' | 'REJECTED') => {
    try {
      await apiClient.patch(`/field-entries/${id}/status`, { status });
      fetchEntries();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Helper getters
  const getEmpId = (e: any) => (e.employee?.id || e.employeeId || e.employee_id || 'N/A').trim();
  const getEmpName = (e: any) => (e.employee?.name || e.employeeName || e.name || 'Sales Agent').trim();
  const getLocation = (e: any) =>
    (e.customerSite?.name || e.site?.name || e.siteName || e.location || e.address || 'Geographical Site').trim();
  const getStatus = (e: any) => (e.status || 'PENDING').toUpperCase();
  const getDate = (e: any) => new Date(e.createdAt || 0).getTime();

  // Extract distinct years from entries
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    entries.forEach((e) => {
      const d = new Date(e.createdAt || Date.now());
      if (!isNaN(d.getFullYear())) {
        years.add(d.getFullYear().toString());
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [entries]);

  // Filter & Multi-Sort Pipeline
  const processedEntries = useMemo(() => {
    const filtered = entries.filter((entry) => {
      const q = searchQuery.toLowerCase().trim();
      const id = getEmpId(entry).toLowerCase();
      const name = getEmpName(entry).toLowerCase();
      const loc = getLocation(entry).toLowerCase();

      const matchesSearch = id.includes(q) || name.includes(q) || loc.includes(q);
      const matchesStatus = statusFilter === 'ALL' ? true : getStatus(entry) === statusFilter;

      const dateObj = new Date(entry.createdAt || 0);
      const entryMonth = dateObj.getMonth().toString();
      const entryYear = dateObj.getFullYear().toString();

      const matchesMonth = selectedMonth === 'ALL' ? true : entryMonth === selectedMonth;
      const matchesYear = selectedYear === 'ALL' ? true : entryYear === selectedYear;

      return matchesSearch && matchesStatus && matchesMonth && matchesYear;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'empId':
          comparison = getEmpId(a).localeCompare(getEmpId(b));
          break;
        case 'name':
          comparison = getEmpName(a).localeCompare(getEmpName(b));
          break;
        case 'location':
          comparison = getLocation(a).localeCompare(getLocation(b));
          break;
        case 'status':
          comparison = getStatus(a).localeCompare(getStatus(b));
          break;
        case 'date':
        default:
          comparison = getDate(a) - getDate(b);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [entries, searchQuery, statusFilter, selectedMonth, selectedYear, sortBy, sortOrder]);

  const exportToCSV = async () => {
    if (processedEntries.length === 0) {
      alert('No entries available to export based on current filters.');
      return;
    }

    try {
      // Pass any required filters; the backend currently processes all/handles mapping
      const res = await apiClient.post<{ csvData: string }>('/exports', {
        searchQuery,
        statusFilter,
        selectedMonth,
        selectedYear,
      });

      if (res.data && res.data.csvData) {
        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + res.data.csvData;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);

        const timestamp = new Date().toISOString().slice(0, 10);
        link.setAttribute('download', `Field_Visit_Report_${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Failed to export records:', err);
      alert('Failed to generate export file. Please try again.');
    }
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setSelectedMonth('ALL');
    setSelectedYear('ALL');
    setSortBy('date');
    setSortOrder('desc');
  };

  const months = [
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header with Live Sync Indicator */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-extrabold heading-gradient-purple tracking-tight">Field Visit Entries</h2>
            {isAutoSync ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Sync
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--glass-bg-primary)] text-[var(--text-main)] opacity-70 border border-[var(--glass-border)]">
                <Radio size={12} /> Sync Paused
              </span>
            )}
          </div>
          <p className="text-sm subtitle-text mt-1 font-medium">
            Real-time feed of field visits, materials, and approvals
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Toggle Auto Sync */}
          <button
            type="button"
            onClick={() => setIsAutoSync(!isAutoSync)}
            className={`flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl font-bold border transition-all cursor-pointer shadow-lg ${isAutoSync
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white shadow-emerald-500/10'
              : 'glass-input border-[var(--glass-border)] text-[var(--text-main)] opacity-80 hover:bg-slate-800'
              }`}
          >
            <RefreshCw size={14} className={isAutoSync ? 'animate-spin' : ''} />
            {isAutoSync ? 'Auto-Sync ON' : 'Auto-Sync OFF'}
          </button>

          {(selectedMonth !== 'ALL' || selectedYear !== 'ALL' || statusFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500 hover:text-white px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer shadow-lg"
            >
              <RotateCcw size={14} /> Reset
            </button>
          )}

          <button
            onClick={exportToCSV}
            className="glass-button flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all cursor-pointer shadow-lg"
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 glass-panel p-5 shadow-2xl border-none">
        {/* Search Bar */}
        <div className="relative w-full lg:col-span-2 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none accent-icon group-focus-within:text-indigo-400 transition-colors">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search EMP ID, Name, Site..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
          />
        </div>

        {/* Month Picker */}
        <div className="relative w-full group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none accent-icon group-focus-within:text-indigo-400 transition-colors">
            <Calendar size={14} />
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="glass-input w-full pl-10 pr-8 py-2.5 text-sm appearance-none cursor-pointer"
          >
            <option value="ALL" className="bg-[var(--glass-bg-primary)] text-[var(--text-main)]">All Months</option>
            {months.map((m) => (
              <option key={m.value} value={m.value} className="bg-[var(--glass-bg-primary)] text-[var(--text-main)]">
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Year Picker */}
        <div className="relative w-full">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="glass-input w-full px-4 py-2.5 text-sm appearance-none cursor-pointer"
          >
            <option value="ALL" className="bg-[var(--glass-bg-primary)] text-[var(--text-main)]">All Years</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr} className="bg-[var(--glass-bg-primary)] text-[var(--text-main)]">
                {yr}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative w-full group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none accent-icon group-focus-within:text-indigo-400 transition-colors">
            <Filter size={14} />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="glass-input w-full pl-10 pr-8 py-2.5 text-sm appearance-none cursor-pointer"
          >
            <option value="ALL" className="bg-[var(--glass-bg-primary)] text-[var(--text-main)]">All Statuses</option>
            <option value="PENDING" className="bg-[var(--glass-bg-primary)] text-[var(--text-main)]">Pending Only</option>
            <option value="APPROVED" className="bg-[var(--glass-bg-primary)] text-[var(--text-main)]">Approved Only</option>
            <option value="REJECTED" className="bg-[var(--glass-bg-primary)] text-[var(--text-main)]">Declined Only</option>
          </select>
        </div>

        {/* Sort Field & Order Toggle */}
        <div className="flex items-center gap-3 w-full">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortField)}
            className="glass-input flex-1 py-2.5 px-4 text-sm appearance-none cursor-pointer"
          >
            <option value="date" className="bg-[var(--glass-bg-primary)] text-[var(--text-main)]">Date</option>
            <option value="empId" className="bg-[var(--glass-bg-primary)] text-[var(--text-main)]">EMP ID</option>
            <option value="name" className="bg-[var(--glass-bg-primary)] text-[var(--text-main)]">Name</option>
            <option value="location" className="bg-[var(--glass-bg-primary)] text-[var(--text-main)]">Location</option>
            <option value="status" className="bg-[var(--glass-bg-primary)] text-[var(--text-main)]">Status</option>
          </select>

          <button
            type="button"
            title={`Toggle Sort Order (${sortOrder === 'asc' ? 'Ascending' : 'Descending'})`}
            onClick={toggleSortOrder}
            className="p-3 bg-[var(--glass-bg-primary)]/50 hover:bg-indigo-500 hover:text-white border border-[var(--glass-border)]/50 hover:border-indigo-500 rounded-xl text-indigo-300 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-lg"
          >
            <ArrowUpDown size={16} />
          </button>
        </div>
      </div>

      {/* Entry Cards Grid */}
      <div className="space-y-4">
        {processedEntries.length === 0 ? (
          <div className="glass-panel p-12 text-center border-none shadow-2xl">
            <div className="text-6xl mb-4 opacity-30">📋</div>
            <p className="text-lg font-bold text-[var(--text-main)] opacity-60">
              {isFetching ? 'Loading latest entries...' : 'No field visit records found.'}
            </p>
            <p className="text-sm text-[var(--text-main)] opacity-40 mt-1">
              Entries will appear here once employees submit field visits.
            </p>
          </div>
        ) : (
          processedEntries.map((entry) => (
            <FieldEntryCard
              key={entry.id}
              entry={entry}
              onStatusUpdate={handleStatusUpdate}
            />
          ))
        )}
      </div>
    </div>
  );
};