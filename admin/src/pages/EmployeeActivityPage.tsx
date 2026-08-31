import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
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

  useEffect(() => {
    fetchActivityData();
  }, [timeframe]);

  const fetchActivityData = async () => {
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Sales Operations Command Center
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium">
            Monitor submission rates, approval percentages, and field activities.
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="inline-flex bg-[var(--bg-surface)] p-1 rounded-lg border border-[var(--border-subtle)] text-xs font-semibold shadow-sm">
          {(['week', 'month', 'year', 'all'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 rounded-md capitalize transition-colors cursor-pointer ${timeframe === t
                  ? 'bg-[var(--brand-subtle)] text-[var(--brand-primary)] font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                }`}
            >
              {t === 'all' ? 'All Time' : `This ${t}`}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Total Submissions</span>
            <TrendingUp size={16} className="text-[var(--brand-primary)]" />
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{totalSubmissions}</p>
          <span className="text-xs text-[var(--text-tertiary)] font-medium mt-1 inline-block">In selected timeframe</span>
        </div>

        <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Approved</span>
            <CheckCircle2 size={16} className="text-[var(--status-success)]" />
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{totalApproved}</p>
          <span className="text-xs text-[var(--status-success)] font-medium mt-1 inline-block bg-[var(--status-success-subtle)] px-2 py-0.5 rounded-md">
            {totalSubmissions > 0 ? Math.round((totalApproved / totalSubmissions) * 100) : 0}% approval rate
          </span>
        </div>

        <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Declined</span>
            <XCircle size={16} className="text-[var(--status-error)]" />
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{totalDeclined}</p>
          <span className="text-xs text-[var(--status-error)] font-medium mt-1 inline-block bg-[var(--status-error-subtle)] px-2 py-0.5 rounded-md">
            {totalSubmissions > 0 ? Math.round((totalDeclined / totalSubmissions) * 100) : 0}% rejection rate
          </span>
        </div>

        <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Pending Review</span>
            <Clock size={16} className="text-[var(--status-warning)]" />
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{totalPending}</p>
          <span className="text-xs text-[var(--status-warning)] font-medium mt-1 inline-block bg-[var(--status-warning-subtle)] px-2 py-0.5 rounded-md">
            Awaiting action
          </span>
        </div>
      </div>

      {/* Employee Breakdown Table */}
      <div className="bg-[var(--bg-surface)] rounded-xl shadow-sm border border-[var(--border-subtle)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <h2 className="font-semibold text-[var(--text-primary)] text-sm">Employee Activity Summary</h2>
          <span className="text-xs bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] font-semibold px-2.5 py-1 rounded-md border border-[var(--border-strong)]">
            {activities.length} Active Employees
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-app)]">
                <th className="py-3 px-4 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">Employee</th>
                <th className="py-3 px-4 text-center font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">Total</th>
                <th className="py-3 px-4 text-center font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">Approved</th>
                <th className="py-3 px-4 text-center font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">Declined</th>
                <th className="py-3 px-4 text-center font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">Pending</th>
                <th className="py-3 px-4 text-center font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">Approval Rate</th>
                <th className="py-3 px-4 text-right font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {activities.map((act) => {
                const rate = act.totalEntries > 0 ? Math.round((act.approvedCount / act.totalEntries) * 100) : 0;
                return (
                  <tr key={act.employeeId} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[var(--text-primary)]">{act.employeeName}</div>
                      <div className="text-xs text-[var(--text-tertiary)] font-medium mt-0.5">{act.employeeId}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-[var(--text-primary)]">{act.totalEntries}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center font-semibold text-[var(--status-success)] bg-[var(--status-success-subtle)] px-2 py-0.5 rounded-md">
                        {act.approvedCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center font-semibold text-[var(--status-error)] bg-[var(--status-error-subtle)] px-2 py-0.5 rounded-md">
                        {act.declinedCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center font-semibold text-[var(--status-warning)] bg-[var(--status-warning-subtle)] px-2 py-0.5 rounded-md">
                        {act.pendingCount}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-16 bg-[var(--border-subtle)] rounded-full h-1.5 overflow-hidden">
                          <div className="bg-[var(--status-success)] h-1.5 rounded-full" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-[var(--text-secondary)] font-medium text-xs w-8 text-right">{rate}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedEmployee(selectedEmployee === act.employeeId ? 'ALL' : act.employeeId)}
                        className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${selectedEmployee === act.employeeId
                            ? 'bg-[var(--brand-primary)] text-white'
                            : 'border border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
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

      {/* Filterable Detailed Visit Log List */}
      <div className="bg-[var(--bg-surface)] rounded-xl shadow-sm border border-[var(--border-subtle)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border-subtle)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)] text-sm flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-[var(--text-tertiary)]" />
              Submission Details & History
            </h2>
            <p className="text-xs text-[var(--text-tertiary)] font-medium mt-1">
              Showing logs {selectedEmployee !== 'ALL' ? `for ${selectedEmployee}` : 'for all employees'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter Badges */}
            <div className="flex bg-[var(--bg-app)] p-1 rounded-lg text-xs font-semibold border border-[var(--border-subtle)]">
              {(['ALL', 'APPROVED', 'DECLINED', 'PENDING'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer text-xs font-semibold ${statusFilter === s ? 'bg-[var(--brand-subtle)] text-[var(--brand-primary)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={14} />
              <input
                type="text"
                placeholder="Search site or agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 w-64 bg-[var(--bg-app)] border border-[var(--border-strong)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Entries List Cards */}
        <div className="p-4">
          {currentEntries.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-[var(--border-subtle)] rounded-lg text-[var(--text-tertiary)] text-sm font-medium">
              No entries found matching the active criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {currentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] hover:border-[var(--border-strong)] transition-colors flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-semibold text-[var(--text-primary)] text-sm">{entry.siteName}</span>
                      <div className="text-xs text-[var(--text-tertiary)] font-medium mt-1">
                        Agent: <strong className="text-[var(--text-secondary)] font-semibold">{entry.employeeName}</strong>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase border ${entry.status === 'APPROVED'
                          ? 'bg-[var(--status-success-subtle)] text-[var(--status-success)] border-[var(--status-success-subtle)]'
                          : entry.status === 'DECLINED'
                            ? 'bg-[var(--status-error-subtle)] text-[var(--status-error)] border-[var(--status-error-subtle)]'
                            : 'bg-[var(--status-warning-subtle)] text-[var(--status-warning)] border-[var(--status-warning-subtle)]'
                        }`}
                    >
                      {entry.status}
                    </span>
                  </div>

                  {entry.materialRequirements && (
                    <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-surface)] p-3 rounded-md border border-[var(--border-subtle)]">
                      {entry.materialRequirements}
                    </p>
                  )}

                  <div className="text-xs text-[var(--text-tertiary)] flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                    <span>Contact: <span className="text-[var(--text-secondary)]">{entry.clientContact}</span></span>
                    <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};