import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  User,
  ShieldCheck,
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

  const exportToCSV = () => {
    if (processedEntries.length === 0) {
      alert('No entries available to export based on current filters.');
      return;
    }

    const headers = [
      'EMP ID',
      'Employee Name',
      'Date',
      'Time',
      'Geographical Location',
      'Items & Quantity Needed',
      'Additional Notes',
      'Status',
      'Image URL',
    ];

    const rows = processedEntries.map((entry: any) => {
      const dateObj = new Date(entry.createdAt || entry.timestamp || Date.now());
      const dateStr = dateObj.toLocaleDateString('en-GB');
      const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const photo = entry.attachments?.[0]?.url || entry.imageUrl || entry.photoUrl || 'N/A';
      const items = (entry.itemsNeeded || entry.materials || entry.remarks || 'None').replace(/"/g, '""');
      const notes = (entry.notes || 'None').replace(/"/g, '""');
      const loc = getLocation(entry).replace(/"/g, '""');

      return [
        `"${getEmpId(entry)}"`,
        `"${getEmpName(entry)}"`,
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"${loc}"`,
        `"${items}"`,
        `"${notes}"`,
        `"${getStatus(entry)}"`,
        `"${photo}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);

    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `Field_Visit_Report_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div className="space-y-6">
      {/* Header with Live Sync Indicator */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Field Visit Entries</h2>
            {isAutoSync ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live DB Sync
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <Radio size={12} /> Sync Paused
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Real-time feed of field visits, materials, and approvals
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Auto Sync */}
          <button
            type="button"
            onClick={() => setIsAutoSync(!isAutoSync)}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium border transition cursor-pointer ${
              isAutoSync
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <RefreshCw size={13} className={isAutoSync ? 'animate-spin' : ''} />
            {isAutoSync ? 'Auto-Sync ON' : 'Auto-Sync OFF'}
          </button>

          {(selectedMonth !== 'ALL' || selectedYear !== 'ALL' || statusFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-2 rounded-lg font-medium transition cursor-pointer"
            >
              <RotateCcw size={14} /> Reset
            </button>
          )}

          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg font-semibold shadow-sm transition cursor-pointer"
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        {/* Search Bar */}
        <div className="relative w-full lg:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search EMP ID, Name, Site..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Month Picker */}
        <div className="relative w-full">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full pl-8 pr-6 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Months</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>
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
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Years</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative w-full">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full pl-8 pr-6 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Only</option>
            <option value="APPROVED">Approved Only</option>
            <option value="REJECTED">Declined Only</option>
          </select>
        </div>

        {/* Sort Field & Order Toggle */}
        <div className="flex items-center gap-1.5 w-full">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortField)}
            className="flex-1 py-2 px-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="date">Date</option>
            <option value="empId">EMP ID</option>
            <option value="name">Name</option>
            <option value="location">Location</option>
            <option value="status">Status</option>
          </select>

          <button
            type="button"
            title={`Toggle Sort Order (${sortOrder === 'asc' ? 'Ascending' : 'Descending'})`}
            onClick={toggleSortOrder}
            className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 transition flex items-center justify-center shrink-0 cursor-pointer"
          >
            <ArrowUpDown size={15} />
          </button>
        </div>
      </div>

      {/* Structured Single-Line Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/75 text-xs uppercase tracking-wider text-gray-500 font-semibold">
              <th
                onClick={() => {
                  setSortBy('empId');
                  toggleSortOrder();
                }}
                className="p-4 cursor-pointer hover:text-blue-600"
              >
                <div className="flex items-center gap-1">
                  <User size={13} />
                  <span>EMP ID</span>
                  {sortBy === 'empId' && (
                    <span className="text-blue-600 text-[10px]">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => {
                  setSortBy('name');
                  toggleSortOrder();
                }}
                className="p-4 cursor-pointer hover:text-blue-600"
              >
                <div className="flex items-center gap-1">
                  <span>Employee Name</span>
                  {sortBy === 'name' && (
                    <span className="text-blue-600 text-[10px]">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => {
                  setSortBy('date');
                  toggleSortOrder();
                }}
                className="p-4 cursor-pointer hover:text-blue-600"
              >
                <div className="flex items-center gap-1">
                  <Calendar size={13} />
                  <span>Date & Time</span>
                  {sortBy === 'date' && (
                    <span className="text-blue-600 text-[10px]">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => {
                  setSortBy('status');
                  toggleSortOrder();
                }}
                className="p-4 cursor-pointer hover:text-blue-600"
              >
                <div className="flex items-center gap-1">
                  <ShieldCheck size={13} />
                  <span>Status</span>
                  {sortBy === 'status' && (
                    <span className="text-blue-600 text-[10px]">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                  )}
                </div>
              </th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {processedEntries.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">
                  {isFetching ? 'Loading latest entries...' : 'No field visit records found.'}
                </td>
              </tr>
            ) : (
              processedEntries.map((entry) => (
                <FieldEntryCard
                  key={entry.id}
                  entry={entry}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};