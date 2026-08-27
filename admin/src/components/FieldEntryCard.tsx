import React, { useState } from 'react';
import {
  Eye,
  X,
  MapPin,
  Calendar,
  Clock,
  Package,
  FileText,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
} from 'lucide-react';

interface FieldEntryCardProps {
  entry: any;
  onStatusUpdate: (id: any, status: 'APPROVED' | 'REJECTED') => void;
}

export const FieldEntryCard: React.FC<FieldEntryCardProps> = ({ entry, onStatusUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);

  const empId = entry.employee?.id || entry.employeeId || entry.employee_id || 'N/A';
  const empName = entry.employee?.name || entry.employeeName || entry.name || 'Sales Agent';

  const dateObj = new Date(entry.createdAt || entry.timestamp || Date.now());
  const dateStr = dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const location =
    entry.customerSite?.name ||
    entry.site?.name ||
    entry.siteName ||
    entry.location ||
    entry.address ||
    'Geographical Site';

  // Handle various formats: web URLs, Base64 strings, or local paths from phone uploads
  const rawPhoto =
    entry.attachments?.[0]?.url ||
    entry.attachments?.[0]?.filePath ||
    entry.photoUrl ||
    entry.imageUrl ||
    (Array.isArray(entry.photos) ? entry.photos[0] : null);

  const formatImageUrl = (src?: string | null) => {
    if (!src) return null;
    if (
      src.startsWith('http://') ||
      src.startsWith('https://') ||
      src.startsWith('data:image/') ||
      src.startsWith('blob:')
    ) {
      return src;
    }
    const cleanPath = src.startsWith('/') ? src : `/${src}`;
    return `http://localhost:3000${cleanPath}`;
  };

  const photoUrl = formatImageUrl(rawPhoto);

  const items =
    entry.itemsNeeded ||
    entry.materials ||
    entry.remarks?.replace(/STATUS:[A-Z]+(\s*\|\s*)?/g, '') ||
    'None requested';

  const notes = entry.notes || entry.additionalNotes || 'No notes added for this visit.';
  const status = (entry.status || 'PENDING').toUpperCase();

  return (
    <>
      {/* 1-Line Table Row */}
      <tr className="hover:bg-white/10 transition-all duration-200 group border-b border-[var(--glass-border)] text-sm cursor-pointer" onClick={() => setIsOpen(true)}>
        <td className="p-5 font-mono font-bold text-[var(--text-main)] group-hover:text-indigo-300 transition-colors">{empId}</td>
        <td className="p-5 font-bold text-[var(--text-main)] opacity-90">{empName}</td>
        <td className="p-5 text-[var(--text-main)] opacity-70 font-medium">
          {dateStr} <span className="opacity-50 mx-1">at</span> {timeStr}
        </td>
        <td className="p-5">
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
              status === 'APPROVED'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/20'
                : status === 'REJECTED'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-rose-500/20'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-amber-500/20'
            }`}
          >
            {status === 'REJECTED' ? 'DECLINED' : status}
          </span>
        </td>
        <td className="p-5 text-right">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500 hover:text-white font-bold text-xs rounded-xl transition-all shadow-lg"
          >
            <Eye size={15} /> View
          </button>
        </td>
      </tr>

      {/* Detail Pop-up Card Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 shadow-[0_0_50px_0_rgba(99,102,241,0.2)]">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-[var(--glass-border)] bg-[var(--glass-bg-primary)]">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg font-bold shadow-sm">
                  {empId}
                </span>
                <h3 className="text-lg font-extrabold text-[var(--text-main)]">{empName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-[var(--text-main)] opacity-70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm text-left custom-scrollbar">
              {/* Date, Time & Geographical Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[var(--glass-bg-primary)]/50 p-5 rounded-2xl border border-[var(--glass-border)] shadow-inner text-xs">
                <div className="flex items-center gap-3 text-[var(--text-main)] opacity-80">
                  <div className="p-2 bg-blue-500/20 rounded-lg shrink-0 border border-blue-500/20">
                    <Calendar size={16} className="text-blue-400" />
                  </div>
                  <span className="font-medium text-sm">{dateStr}</span>
                </div>

                <div className="flex items-center gap-3 text-[var(--text-main)] opacity-80">
                  <div className="p-2 bg-purple-500/20 rounded-lg shrink-0 border border-purple-500/20">
                    <Clock size={16} className="text-purple-400" />
                  </div>
                  <span className="font-medium text-sm">{timeStr}</span>
                </div>

                <div className="sm:col-span-2 flex items-start gap-3 text-[var(--text-main)] opacity-80 pt-3 border-t border-[var(--glass-border)]">
                  <div className="p-2 bg-emerald-500/20 rounded-lg shrink-0 border border-emerald-500/20">
                    <MapPin size={16} className="text-emerald-400" />
                  </div>
                  <div>
                    <span className="font-bold text-[var(--text-main)] block mb-0.5">Geographical Location</span>
                    <span className="text-[var(--text-main)] opacity-70 font-medium">{location}</span>
                  </div>
                </div>
              </div>

              {/* Uploaded Site Image */}
              <div>
                <label className="text-xs font-bold text-[var(--text-main)] opacity-70 uppercase tracking-wider block mb-2 flex items-center gap-2">
                  <ImageIcon size={15} className="text-blue-400" /> Uploaded Site Picture
                </label>
                {photoUrl ? (
                  <div className="rounded-2xl overflow-hidden border border-[var(--glass-border)] shadow-lg aspect-video max-h-56 bg-[var(--glass-bg-primary)] flex items-center justify-center">
                    <img
                      src={photoUrl}
                      alt="Field Visit Verification"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="p-6 text-center bg-[var(--glass-bg-primary)]/50 border border-dashed border-[var(--glass-border)] rounded-2xl text-slate-500 text-xs font-medium">
                    No site photo attached to this visit.
                  </div>
                )}
              </div>

              {/* Items & Quantity */}
              <div>
                <label className="text-xs font-bold text-[var(--text-main)] opacity-70 uppercase tracking-wider block mb-2 flex items-center gap-2">
                  <Package size={15} className="text-amber-400" /> Items & Quantity Needed
                </label>
                <div className="p-4 bg-[var(--glass-bg-primary)]/50 border border-[var(--glass-border)] shadow-inner rounded-2xl text-sm font-medium text-[var(--text-main)] opacity-80">
                  {items}
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="text-xs font-bold text-[var(--text-main)] opacity-70 uppercase tracking-wider block mb-2 flex items-center gap-2">
                  <FileText size={15} className="text-indigo-400" /> Additional Notes
                </label>
                <div className="p-4 bg-[var(--glass-bg-primary)]/50 border border-[var(--glass-border)] shadow-inner rounded-2xl text-sm text-[var(--text-main)] opacity-80 leading-relaxed">
                  {notes}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-5 border-t border-[var(--glass-border)] bg-[var(--glass-bg-primary)]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-[var(--text-main)] opacity-70 font-medium">
                Status:{' '}
                <strong className={`uppercase px-2 py-1 rounded-md ml-1 ${
                    status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                    status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400' :
                    'bg-amber-500/20 text-amber-400'
                }`}>
                  {status === 'REJECTED' ? 'DECLINED' : status}
                </strong>
              </span>

              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    onStatusUpdate(entry.id, 'REJECTED');
                    setIsOpen(false);
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 border border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer"
                >
                  <XCircle size={16} /> Decline
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onStatusUpdate(entry.id, 'APPROVED');
                    setIsOpen(false);
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer"
                >
                  <CheckCircle size={16} /> Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};