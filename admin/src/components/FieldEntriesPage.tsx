import React, { useState, useEffect } from 'react';
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

      {/* Filter and Search Bar */}
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

      {/* Clean Single-Line Table */}
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

      {/* Card Details Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
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

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-gray-700">
              {/* Employee & Date-Time Bar */}
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

              {/* Uploaded Image */}
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

              {/* Items & Quantity */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Package size={14} className="text-amber-500" /> Items & Quantity Needed
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 font-medium">
                  {selectedEntry.itemsNeeded || selectedEntry.remarks || 'None specified'}
                </div>
              </div>

              {/* Additional Note */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <FileText size={14} className="text-indigo-500" /> Additional Notes
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 leading-relaxed">
                  {selectedEntry.notes || 'No additional note provided.'}
                </div>
              </div>
            </div>

            {/* Approve / Decline Actions */}
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
};