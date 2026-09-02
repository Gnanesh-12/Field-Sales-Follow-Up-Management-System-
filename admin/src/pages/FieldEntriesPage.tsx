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
  Check,
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

  // Date filter states (multi-select: empty array = "All")
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

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

  // Close month/year dropdowns when clicking outside of them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target as Node)) {
        setIsMonthDropdownOpen(false);
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
        setIsYearDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMonthSelection = (value: string) => {
    setSelectedMonths((prev) =>
      prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value]
    );
  };

  const toggleYearSelection = (value: string) => {
    setSelectedYears((prev) =>
      prev.includes(value) ? prev.filter((y) => y !== value) : [...prev, value]
    );
  };

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

      const matchesMonth = selectedMonths.length === 0 ? true : selectedMonths.includes(entryMonth);
      const matchesYear = selectedYears.length === 0 ? true : selectedYears.includes(entryYear);

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
  }, [entries, searchQuery, statusFilter, selectedMonths, selectedYears, sortBy, sortOrder]);

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
        selectedMonths,
        selectedYears,
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
    setSelectedMonths([]);
    setSelectedYears([]);
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header with Live Sync Indicator */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Field Visit Entries</h1>
            {isAutoSync ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[var(--status-success-subtle)] text-[var(--status-success)] border border-[var(--status-success-subtle)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)] animate-ping" />
                Live Sync
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border border-[var(--border-strong)]">
                <Radio size={10} /> Paused
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium">
            Real-time feed of field visits, materials, and approvals
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Toggle Auto Sync */}
          <button
            type="button"
            onClick={() => setIsAutoSync(!isAutoSync)}
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-md font-semibold border transition-colors cursor-pointer ${isAutoSync
              ? 'bg-[var(--status-success-subtle)] border-[var(--status-success-subtle)] text-[var(--status-success)] hover:bg-[var(--status-success)] hover:text-white'
              : 'bg-[var(--bg-surface)] border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
              }`}
          >
            <RefreshCw size={14} className={isAutoSync ? 'animate-spin' : ''} />
            {isAutoSync ? 'Auto-Sync ON' : 'Auto-Sync OFF'}
          </button>

          {(selectedMonths.length > 0 || selectedYears.length > 0 || statusFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 text-xs bg-[var(--status-error-subtle)] text-[var(--status-error)] hover:bg-[var(--status-error)] hover:text-white px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw size={14} /> Reset Filters
            </button>
          )}

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-md text-sm font-semibold transition-colors cursor-pointer shadow-sm"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-subtle)] shadow-sm">
        {/* Search Bar */}
        <div className="relative w-full lg:col-span-2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-tertiary)]">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search EMP ID, Name, Site..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[var(--bg-app)] border border-[var(--border-strong)] rounded-md text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
          />
        </div>

        {/* Month Picker (multi-select) */}
        <div className="relative w-full" ref={monthDropdownRef}>
          <button
            type="button"
            onClick={() => setIsMonthDropdownOpen((prev) => !prev)}
            className="w-full flex items-center pl-9 pr-8 py-2 bg-[var(--bg-app)] border border-[var(--border-strong)] rounded-md text-sm text-[var(--text-primary)] text-left cursor-pointer focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-tertiary)]">
              <Calendar size={14} />
            </div>
            <span className="truncate">
              {selectedMonths.length === 0
                ? 'All Months'
                : selectedMonths.length === 1
                  ? months.find((m) => m.value === selectedMonths[0])?.label
                  : `${selectedMonths.length} Months Selected`}
            </span>
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-[var(--text-tertiary)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </div>
          </button>

          {isMonthDropdownOpen && (
            <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-md shadow-lg py-1">
              {months.map((m) => {
                const checked = selectedMonths.includes(m.value);
                return (
                  <button
                    type="button"
                    key={m.value}
                    onClick={() => toggleMonthSelection(m.value)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] cursor-pointer text-left"
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)]' : 'border-[var(--border-strong)]'}`}>
                      {checked && <Check size={12} className="text-white" />}
                    </span>
                    {m.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Year Picker (multi-select) */}
        <div className="relative w-full" ref={yearDropdownRef}>
          <button
            type="button"
            onClick={() => setIsYearDropdownOpen((prev) => !prev)}
            className="w-full flex items-center pl-3 pr-8 py-2 bg-[var(--bg-app)] border border-[var(--border-strong)] rounded-md text-sm text-[var(--text-primary)] text-left cursor-pointer focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
          >
            <span className="truncate">
              {selectedYears.length === 0
                ? 'All Years'
                : selectedYears.length === 1
                  ? selectedYears[0]
                  : `${selectedYears.length} Years Selected`}
            </span>
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-[var(--text-tertiary)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </div>
          </button>

          {isYearDropdownOpen && (
            <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-md shadow-lg py-1">
              {availableYears.length === 0 && (
                <div className="px-3 py-1.5 text-sm text-[var(--text-tertiary)]">No years available</div>
              )}
              {availableYears.map((yr) => {
                const checked = selectedYears.includes(yr);
                return (
                  <button
                    type="button"
                    key={yr}
                    onClick={() => toggleYearSelection(yr)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] cursor-pointer text-left"
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)]' : 'border-[var(--border-strong)]'}`}>
                      {checked && <Check size={12} className="text-white" />}
                    </span>
                    {yr}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-tertiary)]">
            <Filter size={14} />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full pl-9 pr-8 py-2 bg-[var(--bg-app)] border border-[var(--border-strong)] rounded-md text-sm text-[var(--text-primary)] appearance-none cursor-pointer focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Only</option>
            <option value="APPROVED">Approved Only</option>
            <option value="REJECTED">Declined Only</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-[var(--text-tertiary)]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          </div>
        </div>

        {/* Sort Field & Order Toggle */}
        <div className="flex items-center gap-2 w-full">
          <div className="relative flex-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              className="w-full pl-3 pr-8 py-2 bg-[var(--bg-app)] border border-[var(--border-strong)] rounded-md text-sm text-[var(--text-primary)] appearance-none cursor-pointer focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
            >
              <option value="date">Date</option>
              <option value="empId">EMP ID</option>
              <option value="name">Name</option>
              <option value="location">Location</option>
              <option value="status">Status</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-[var(--text-tertiary)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </div>
          </div>

          <button
            type="button"
            title={`Toggle Sort Order (${sortOrder === 'asc' ? 'Ascending' : 'Descending'})`}
            onClick={toggleSortOrder}
            className="p-2 bg-[var(--bg-app)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--brand-primary)] border border-[var(--border-strong)] rounded-md text-[var(--text-secondary)] transition-colors flex items-center justify-center shrink-0 cursor-pointer"
          >
            <ArrowUpDown size={16} />
          </button>
        </div>
      </div>

      {/* Entry Cards Grid */}
      <div className="space-y-4">
        {processedEntries.length === 0 ? (
          <div className="bg-[var(--bg-surface)] rounded-xl p-12 text-center border-2 border-dashed border-[var(--border-subtle)]">
            <div className="text-4xl mb-3 text-[var(--text-tertiary)]">📋</div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {isFetching ? 'Loading latest entries...' : 'No field visit records found.'}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
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