/*import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Eye,
  X,
  MapPin,
  Calendar,
  Clock,
  User,
  FileText,
  Package,
  CheckCircle,
  XCircle,
  Image as ImageIcon
} from 'lucide-react';
import { apiClient } from '../api';

export interface FieldEntry {
  id: string;
  employeeId?: string;
  employee?: {
    id: string;
    name: string;
    phone?: string;
  };
  siteName?: string;
  location?: string;
  address?: string;
  photoUrl?: string;
  imageUrl?: string;
  itemsNeeded?: string;
  quantity?: string | number;
  materials?: any[];
  notes?: string;
  remarks?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: string;
  timestamp?: string;
}

export const FieldEntriesPage: React.FC = () => {
  const [entries, setEntries] = useState<FieldEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [selectedEntry, setSelectedEntry] = useState<FieldEntry | null>(null);

  const fetchEntries = async () => {
    try {
      const res = await apiClient.get<FieldEntry[]>('/field-entries');
      setEntries(res.data);
    } catch (err) {
      console.error('Failed to load field entries:', err);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await apiClient.patch(`/field-entries/${id}/status`, { status });
      setSelectedEntry(null);
      fetchEntries();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update entry status');
    }
  };

  const filteredEntries = entries.filter((entry) => {
    const q = searchQuery.toLowerCase().trim();
    const empId = (entry.employee?.id || entry.employeeId || '').toLowerCase();
    const empName = (entry.employee?.name || '').toLowerCase();

    const matchesSearch = empId.includes(q) || empName.includes(q);
    const matchesStatus =
      statusFilter === 'ALL' ? true : (entry.status || 'PENDING').toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Field Entries & Approvals</h2>
        <p className="text-sm text-slate-500">Monitor employee submissions and review approvals</p>
      </div>

     
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by EMP ID or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition"
          />
        </div>

        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Only</option>
            <option value="APPROVED">Approved Only</option>
            <option value="REJECTED">Declined Only</option>
          </select>
        </div>
      </div>

      
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/75 text-xs uppercase tracking-wider text-gray-500 font-semibold">
              <th className="p-4">EMP ID</th>
              <th className="p-4">Name</th>
              <th className="p-4">Date</th>
              <th className="p-4">Time</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400 text-sm">
                  No records found.
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => {
                const empId = entry.employee?.id || entry.employeeId || '—';
                const empName = entry.employee?.name || '—';
                const dateObj = new Date(entry.createdAt || entry.timestamp || Date.now());
                const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                const status = (entry.status || 'PENDING').toUpperCase();

                return (
                  <tr key={entry.id} className="hover:bg-gray-50/80 transition">
                    <td className="p-4 font-mono font-bold text-gray-900">{empId}</td>
                    <td className="p-4 font-medium text-gray-800">{empName}</td>
                    <td className="p-4 text-gray-600">{dateStr}</td>
                    <td className="p-4 text-gray-600">{timeStr}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {status === 'REJECTED' ? 'DECLINED' : status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedEntry(entry)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium text-xs rounded-lg transition"
                      >
                        <Eye size={15} /> View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/75">
              <div>
                <h3 className="text-base font-bold text-gray-900">Visit Inspection Card</h3>
                <p className="text-xs font-mono text-gray-500">EMP ID: {selectedEntry.employee?.id || selectedEntry.employeeId || 'N/A'}</p>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-gray-700">
              
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-gray-700">
                  <User size={15} className="text-blue-600" />
                  <span><strong>Name:</strong> {selectedEntry.employee?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar size={15} className="text-purple-600" />
                  <span><strong>Date:</strong> {new Date(selectedEntry.createdAt || selectedEntry.timestamp || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock size={15} className="text-indigo-600" />
                  <span><strong>Time:</strong> {new Date(selectedEntry.createdAt || selectedEntry.timestamp || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin size={15} className="text-emerald-600 shrink-0" />
                  <span className="truncate"><strong>GPS / Location:</strong> {selectedEntry.location || selectedEntry.address || selectedEntry.siteName || 'Bengaluru'}</span>
                </div>
              </div>

             
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-blue-500" /> Uploaded Picture
                </label>
                {selectedEntry.photoUrl || selectedEntry.imageUrl ? (
                  <div className="rounded-xl overflow-hidden border border-gray-200 aspect-video max-h-52 bg-black flex items-center justify-center">
                    <img
                      src={
                        (selectedEntry.photoUrl || selectedEntry.imageUrl)!.startsWith('http')
                          ? selectedEntry.photoUrl || selectedEntry.imageUrl
                          : `http://localhost:3000${selectedEntry.photoUrl || selectedEntry.imageUrl}`
                      }
                      alt="Site Visit"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="p-6 text-center bg-gray-50 border border-dashed rounded-xl text-gray-400 text-xs">
                    No image uploaded for this entry.
                  </div>
                )}
              </div>

              
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Package size={14} className="text-amber-500" /> Items & Quantity Needed
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 font-medium">
                  {selectedEntry.itemsNeeded || selectedEntry.remarks || 'None specified'}
                </div>
              </div>

              
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <FileText size={14} className="text-indigo-500" /> Additional Notes
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 leading-relaxed">
                  {selectedEntry.notes || 'No additional note provided.'}
                </div>
              </div>
            </div>

            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                Status: <strong className="uppercase text-gray-800">{selectedEntry.status || 'PENDING'}</strong>
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedEntry.id, 'REJECTED')}
                  className="flex items-center gap-1.5 px-4 py-2 border border-rose-200 text-rose-700 bg-white hover:bg-rose-50 rounded-xl font-semibold text-xs transition shadow-sm"
                >
                  <XCircle size={15} /> Decline
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedEntry.id, 'APPROVED')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-[var(--text-main)] rounded-xl font-semibold text-xs shadow-sm transition"
                >
                  <CheckCircle size={15} /> Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};*/
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp, 
  Search,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { apiClient } from '../api';

interface ActivitySummary {
  employeeId: string;
  employeeName: string;
  totalEntries: number;
  approvedCount: number;
  declinedCount: number;
  pendingCount: number;
  entries: {
    id: string;
    siteName: string;
    clientContact?: string;
    status: 'APPROVED' | 'DECLINED' | 'PENDING';
    createdAt: string;
    materialRequirements?: string;
  }[];
}

export const EmployeeActivityPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'DECLINED' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activities, setActivities] = useState<ActivitySummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActivityData();
  }, [timeframe]);

  const fetchActivityData = async () => {
    setLoading(true);
    try {
      const [empRes, entriesRes] = await Promise.all([
        apiClient.get('/employees').catch(() => ({ data: [] })),
        apiClient.get('/field-entries').catch(() => ({ data: [] }))
      ]);

      const employees = Array.isArray(empRes.data) ? empRes.data : [];
      const rawEntries = Array.isArray(entriesRes.data) ? entriesRes.data : [];

      const now = new Date();
      const filteredByTime = rawEntries.filter((entry: any) => {
        const entryDate = new Date(entry.createdAt || entry.date || Date.now());
        if (timeframe === 'week') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(now.getDate() - 7);
          return entryDate >= oneWeekAgo;
        }
        if (timeframe === 'month') {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(now.getMonth() - 1);
          return entryDate >= oneMonthAgo;
        }
        if (timeframe === 'year') {
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(now.getFullYear() - 1);
          return entryDate >= oneYearAgo;
        }
        return true;
      });

      const summaryMap: Record<string, ActivitySummary> = {};

      employees.forEach((emp: any) => {
        const empId = emp.id || emp.email;
        summaryMap[empId] = {
          employeeId: empId,
          employeeName: emp.name || empId,
          totalEntries: 0,
          approvedCount: 0,
          declinedCount: 0,
          pendingCount: 0,
          entries: [],
        };
      });

      filteredByTime.forEach((entry: any) => {
        const empId = entry.employeeId || entry.userId || entry.employee?.id || 'Unknown';
        if (!summaryMap[empId]) {
          summaryMap[empId] = {
            employeeId: empId,
            employeeName: entry.employee?.name || empId,
            totalEntries: 0,
            approvedCount: 0,
            declinedCount: 0,
            pendingCount: 0,
            entries: [],
          };
        }

        const summary = summaryMap[empId];
        summary.totalEntries += 1;
        const normStatus = (entry.status || 'PENDING').toUpperCase();

        if (normStatus === 'APPROVED') summary.approvedCount += 1;
        else if (normStatus === 'DECLINED' || normStatus === 'REJECTED') summary.declinedCount += 1;
        else summary.pendingCount += 1;

        summary.entries.push({
          id: entry.id,
          siteName: entry.siteName || entry.customerSite?.name || 'Site Visit',
          clientContact: entry.clientContact || entry.contactNumber || 'N/A',
          status: normStatus as any,
          createdAt: entry.createdAt || new Date().toISOString(),
          materialRequirements: entry.materialRequirements || entry.notes || '',
        });
      });

      setActivities(Object.values(summaryMap));
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalSubmissions = activities.reduce((acc, curr) => acc + curr.totalEntries, 0);
  const totalApproved = activities.reduce((acc, curr) => acc + curr.approvedCount, 0);
  const totalDeclined = activities.reduce((acc, curr) => acc + curr.declinedCount, 0);
  const totalPending = activities.reduce((acc, curr) => acc + curr.pendingCount, 0);

  const currentEntries = activities
    .filter(a => selectedEmployee === 'ALL' || a.employeeId === selectedEmployee)
    .flatMap(a => a.entries.map(e => ({ ...e, employeeName: a.employeeName, empId: a.employeeId })))
    .filter(e => statusFilter === 'ALL' || e.status === statusFilter)
    .filter(e => 
      e.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="space-y-6 text-[var(--text-main)]">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3 text-gradient">
            <BarChart3 className="text-cyan-400" size={28} />
            Employee Activity & Analytics
          </h1>
          <p className="text-xs text-indigo-200/70 mt-1 font-medium">
            Monitor submission rates, approval percentages, and field logs.
          </p>
        </div>

        {/* Timeframe Filter Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchActivityData}
            disabled={loading}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-indigo-300 transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <div className="flex bg-black/20 p-1 rounded-2xl border border-white/10 backdrop-blur-md text-xs font-bold">
            {(['week', 'month', 'year', 'all'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer ${
                  timeframe === t 
                    ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 border border-cyan-500/40 shadow-sm font-black' 
                    : 'text-indigo-200/60 hover:text-white'
                }`}
              >
                {t === 'all' ? 'All Time' : `This ${t}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-200/60 uppercase tracking-wider">Total Submissions</span>
            <TrendingUp size={18} className="text-cyan-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">{totalSubmissions}</p>
          <span className="text-[10px] text-indigo-300/50 font-medium">In selected timeframe</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Approved</span>
            <CheckCircle2 size={18} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-300 mt-2">{totalApproved}</p>
          <span className="text-[10px] text-emerald-400/80 font-medium">
            {totalSubmissions > 0 ? Math.round((totalApproved / totalSubmissions) * 100) : 0}% approval rate
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Declined</span>
            <XCircle size={18} className="text-rose-400" />
          </div>
          <p className="text-2xl font-extrabold text-rose-300 mt-2">{totalDeclined}</p>
          <span className="text-[10px] text-rose-400/80 font-medium">
            {totalSubmissions > 0 ? Math.round((totalDeclined / totalSubmissions) * 100) : 0}% rejection rate
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Pending</span>
            <Clock size={18} className="text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-300 mt-2">{totalPending}</p>
          <span className="text-[10px] text-amber-400/80 font-medium">Awaiting action</span>
        </div>
      </div>

      {/* Employee Breakdown Table */}
      <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-bold text-sm text-white">Agent Performance Summary</h2>
          <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold px-3 py-0.5 rounded-full">
            {activities.length} Active Agents
          </span>
        </div>

        <div className="overflow-x-auto max-h-56 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
              <tr className="border-b border-white/10 text-indigo-200/60 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Agent</th>
                <th className="py-3 px-4 text-center">Entries</th>
                <th className="py-3 px-4 text-center">Approved</th>
                <th className="py-3 px-4 text-center">Declined</th>
                <th className="py-3 px-4 text-center">Pending</th>
                <th className="py-3 px-4 text-center">Success Rate</th>
                <th className="py-3 px-4 text-right">Filter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {activities.map((act) => {
                const rate = act.totalEntries > 0 ? Math.round((act.approvedCount / act.totalEntries) * 100) : 0;
                return (
                  <tr key={act.employeeId} className="hover:bg-white/5 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{act.employeeName}</div>
                      <div className="text-[11px] text-indigo-300/50 font-medium">{act.employeeId}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-white">{act.totalEntries}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        {act.approvedCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                        {act.declinedCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        {act.pendingCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-1.5 rounded-full" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-white text-[11px]">{rate}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedEmployee(selectedEmployee === act.employeeId ? 'ALL' : act.employeeId)}
                        className={`text-xs px-2.5 py-1 rounded-xl font-bold border transition cursor-pointer ${
                          selectedEmployee === act.employeeId
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                            : 'border-white/10 text-indigo-200 hover:bg-white/10'
                        }`}
                      >
                        {selectedEmployee === act.employeeId ? 'Selected' : 'Select'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filterable Detailed Visit Log List */}
      <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-white text-sm">
              Field Log Submissions {selectedEmployee !== 'ALL' && <span className="text-cyan-400 font-semibold">({selectedEmployee})</span>}
            </h2>
            <p className="text-xs text-indigo-200/50 mt-0.5">Filter by review status or search by site name</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Buttons */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-bold">
              {(['ALL', 'APPROVED', 'DECLINED', 'PENDING'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer text-[11px] ${
                    statusFilter === s 
                      ? 'bg-white/15 text-white shadow-sm font-black' 
                      : 'text-indigo-200/60 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300/40" size={14} />
              <input
                type="text"
                placeholder="Search site..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-white placeholder:text-indigo-300/40 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Entries Grid */}
        {currentEntries.length === 0 ? (
          <div className="text-center py-8 text-indigo-200/40 text-xs">
            No submissions found for the selected filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
            {currentEntries.map((entry) => (
              <div
                key={entry.id}
                className="p-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition flex flex-col justify-between space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white text-sm">{entry.siteName}</h3>
                    <div className="text-[11px] text-indigo-300/70 mt-0.5">
                      Agent: <strong className="text-indigo-200">{entry.employeeName}</strong>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                      entry.status === 'APPROVED'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        : entry.status === 'DECLINED'
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                    }`}
                  >
                    {entry.status}
                  </span>
                </div>

                {entry.materialRequirements && (
                  <p className="text-xs text-indigo-100/80 bg-black/20 p-2 rounded-lg border border-white/5">
                    {entry.materialRequirements}
                  </p>
                )}

                <div className="text-[10px] text-indigo-300/50 flex items-center justify-between pt-1 border-t border-white/5">
                  <span>Contact: {entry.clientContact}</span>
                  <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};