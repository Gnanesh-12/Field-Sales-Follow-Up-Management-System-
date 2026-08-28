import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  User, 
  Filter, 
  Search,
  ArrowUpRight,
  TrendingUp,
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityData();
  }, [timeframe]);

  const fetchActivityData = async () => {
    setLoading(true);
    try {
      // Fetches aggregated field entries & employees from the backend
      const [empRes, entriesRes] = await Promise.all([
        apiClient.get('/employees').catch(() => ({ data: [] })),
        apiClient.get('/field-entries').catch(() => ({ data: [] }))
      ]);

      const employees = Array.isArray(empRes.data) ? empRes.data : [];
      const rawEntries = Array.isArray(entriesRes.data) ? entriesRes.data : [];

      // Filter entries based on the chosen timeframe
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

      // Group activities by Employee
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

  // Aggregated totals across all employees for the dashboard top cards
  const totalSubmissions = activities.reduce((acc, curr) => acc + curr.totalEntries, 0);
  const totalApproved = activities.reduce((acc, curr) => acc + curr.approvedCount, 0);
  const totalDeclined = activities.reduce((acc, curr) => acc + curr.declinedCount, 0);
  const totalPending = activities.reduce((acc, curr) => acc + curr.pendingCount, 0);

  // Active entries filtered by selected employee, search query, and status
  const currentEntries = activities
    .filter(a => selectedEmployee === 'ALL' || a.employeeId === selectedEmployee)
    .flatMap(a => a.entries.map(e => ({ ...e, employeeName: a.employeeName, empId: a.employeeId })))
    .filter(e => statusFilter === 'ALL' || e.status === statusFilter)
    .filter(e => 
      e.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={24} />
            Employee Activity & Log Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Monitor submission rates, approval percentages, and detailed visit histories.
          </p>
        </div>

        {/* Timeframe Selector Buttons */}
        <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          {(['week', 'month', 'year', 'all'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 rounded-lg capitalize transition cursor-pointer ${
                timeframe === t 
                  ? 'bg-white text-slate-900 shadow-sm font-black' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t === 'all' ? 'All Time' : `This ${t}`}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Submissions</span>
            <TrendingUp size={18} className="text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalSubmissions}</p>
          <span className="text-[11px] text-slate-400 font-medium">In selected timeframe</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Approved</span>
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{totalApproved}</p>
          <span className="text-[11px] text-emerald-600/80 font-medium">
            {totalSubmissions > 0 ? Math.round((totalApproved / totalSubmissions) * 100) : 0}% approval rate
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Declined</span>
            <XCircle size={18} className="text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">{totalDeclined}</p>
          <span className="text-[11px] text-rose-600/80 font-medium">
            {totalSubmissions > 0 ? Math.round((totalDeclined / totalSubmissions) * 100) : 0}% rejection rate
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Review</span>
            <Clock size={18} className="text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{totalPending}</p>
          <span className="text-[11px] text-amber-600/80 font-medium">Awaiting action</span>
        </div>
      </div>

      {/* Employee Breakdown Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <h2 className="font-bold text-slate-800 text-sm">Employee Activity Summary</h2>
          <span className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full">
            {activities.length} Active Employees
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4 text-center">Total Entries</th>
                <th className="py-3.5 px-4 text-center">Approved</th>
                <th className="py-3.5 px-4 text-center">Declined</th>
                <th className="py-3.5 px-4 text-center">Pending</th>
                <th className="py-3.5 px-4 text-center">Approval Rate</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activities.map((act) => {
                const rate = act.totalEntries > 0 ? Math.round((act.approvedCount / act.totalEntries) * 100) : 0;
                return (
                  <tr key={act.employeeId} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{act.employeeName}</div>
                      <div className="text-[11px] text-slate-400 font-medium">{act.employeeId}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">{act.totalEntries}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {act.approvedCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                        {act.declinedCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                        {act.pendingCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-slate-700 font-bold">{rate}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedEmployee(selectedEmployee === act.employeeId ? 'ALL' : act.employeeId)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                          selectedEmployee === act.employeeId
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {selectedEmployee === act.employeeId ? 'Showing Logs' : 'Filter Logs'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filterable Detailed Visit Log List (Approved / Declined / Pending) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-blue-600" />
              Submission Details & History
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Showing logs {selectedEmployee !== 'ALL' ? `for ${selectedEmployee}` : 'for all employees'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Badges */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
              {(['ALL', 'APPROVED', 'DECLINED', 'PENDING'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer text-[11px] font-bold ${
                    statusFilter === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search site or agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Entries List Cards */}
        {currentEntries.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs font-medium">
            No entries found matching the active criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {currentEntries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{entry.siteName}</span>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Agent: <strong className="text-slate-700">{entry.employeeName}</strong>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase ${
                      entry.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : entry.status === 'DECLINED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {entry.status}
                  </span>
                </div>

                {entry.materialRequirements && (
                  <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/60 font-medium">
                    {entry.materialRequirements}
                  </p>
                )}

                <div className="text-[11px] text-slate-400 flex items-center justify-between font-medium border-t border-slate-200/40 pt-2">
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