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
  User,
  ExternalLink,
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

  const siteName =
    entry.customerSite?.name ||
    entry.site?.name ||
    entry.siteName ||
    entry.location ||
    entry.address ||
    'Field Site';

  const rawPhoto =
    entry.attachments?.[0]?.fileUrl ||
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
  const notes = entry.notes || entry.additionalNotes || 'No notes added for this visit.';
  const status = (entry.status || 'PENDING').toUpperCase();

  const statusConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
    APPROVED: { bg: 'bg-emerald-500/15', text: 'text-emerald-600', border: 'border-emerald-500/30', label: 'APPROVED' },
    REJECTED: { bg: 'bg-rose-500/15', text: 'text-rose-600', border: 'border-rose-500/30', label: 'DECLINED' },
    PENDING: { bg: 'bg-amber-500/15', text: 'text-amber-600', border: 'border-amber-500/30', label: 'PENDING' },
  };
  const st = statusConfig[status] || statusConfig['PENDING'];

  return (
    <>
      {/* ─── Entry Card ─────────────────────────────────── */}
      <div
        className="glass-panel border-none shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex flex-col sm:flex-row items-stretch">
          {/* Photo Thumbnail */}
          <div className="sm:w-44 w-full h-32 sm:h-auto shrink-0 bg-[var(--glass-bg-primary)] overflow-hidden rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Site visit"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML =
                    '<div class="w-full h-full flex items-center justify-center opacity-30"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-20">
                <ImageIcon size={40} />
              </div>
            )}
          </div>

          {/* Card Content */}
          <div className="flex-1 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Employee Info */}
            <div className="flex items-center gap-3 sm:w-52 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <User size={18} className="text-indigo-500" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-[var(--text-main)] truncate">{empName}</p>
                <p className="text-xs font-mono text-[var(--text-main)] opacity-50">{empId}</p>
              </div>
            </div>

            {/* Site & Location */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={14} className="text-emerald-500 shrink-0" />
                <p className="text-sm font-semibold text-[var(--text-main)] truncate">{siteName}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-[var(--text-main)] opacity-50">
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> {dateStr}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {timeStr}
                </span>
              </div>
              {entry.gpsLat && entry.gpsLng && (
                <p className="text-[11px] text-[var(--text-main)] opacity-40 mt-1 font-mono">
                  📍 {Number(entry.gpsLat).toFixed(4)}, {Number(entry.gpsLng).toFixed(4)}
                </p>
              )}
            </div>

            {/* Status + Action */}
            <div className="flex items-center gap-3 shrink-0">
              {entry.followUps && entry.followUps.length > 0 && (
                <div className="flex items-center gap-2 border-r border-[var(--glass-border)] pr-3 mr-1">
                  {entry.followUps.every((f: any) => f.status === 'completed') ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                      <CheckCircle size={12} /> Follow-up Completed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-500 bg-cyan-500/10 px-2 py-1 rounded-md border border-cyan-500/20">
                      <Calendar size={12} /> Follow-up Pending
                    </span>
                  )}
                </div>
              )}
              <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold border ${st.bg} ${st.text} ${st.border}`}>
                {st.label}
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-500 border border-indigo-500/25 hover:bg-indigo-500 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <Eye size={14} /> View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Detail Modal ─────────────────────────────── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div
            className="bg-[var(--glass-bg-primary)] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] rounded-2xl shadow-2xl border border-[var(--glass-border)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--glass-border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                  <User size={18} className="text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--text-main)]">{empName}</h3>
                  <span className="text-xs font-mono text-[var(--text-main)] opacity-50">{empId}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${st.bg} ${st.text} ${st.border}`}>
                  {st.label}
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl text-[var(--text-main)] opacity-50 hover:opacity-100 hover:bg-[var(--glass-border)] transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* Date, Time & Location */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--glass-bg-primary)] border border-[var(--glass-border)]">
                  <div className="p-2 bg-blue-500/15 rounded-lg border border-blue-500/15">
                    <Calendar size={15} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-main)] opacity-40 font-bold">Date</p>
                    <p className="text-sm font-semibold text-[var(--text-main)]">{dateStr}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--glass-bg-primary)] border border-[var(--glass-border)]">
                  <div className="p-2 bg-purple-500/15 rounded-lg border border-purple-500/15">
                    <Clock size={15} className="text-purple-500" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-main)] opacity-40 font-bold">Time</p>
                    <p className="text-sm font-semibold text-[var(--text-main)]">{timeStr}</p>
                  </div>
                </div>
              </div>

              {/* Customer Site & GPS */}
              <div className="p-4 rounded-xl bg-[var(--glass-bg-primary)] border border-[var(--glass-border)]">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-500/15 rounded-lg border border-emerald-500/15 shrink-0">
                    <MapPin size={15} className="text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-main)] opacity-40 font-bold mb-1">Customer Site</p>
                    <p className="text-sm font-bold text-[var(--text-main)]">{siteName}</p>
                    {entry.gpsLat && entry.gpsLng && (
                      <a
                        href={`https://www.google.com/maps?q=${entry.gpsLat},${entry.gpsLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-500 hover:text-blue-400 transition-colors font-medium"
                      >
                        <MapPin size={11} />
                        {Number(entry.gpsLat).toFixed(6)}, {Number(entry.gpsLng).toFixed(6)}
                        <ExternalLink size={10} className="opacity-60" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Site Image */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-main)] opacity-40 font-bold mb-2 flex items-center gap-2">
                  <ImageIcon size={13} className="text-blue-500" /> Site Photo
                </p>
                {photoUrl ? (
                  <div className="rounded-xl overflow-hidden border border-[var(--glass-border)] shadow-md aspect-video max-h-64 bg-black/5 flex items-center justify-center">
                    <img
                      src={photoUrl}
                      alt="Field Visit"
                      className="w-full h-full object-contain"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed border-[var(--glass-border)] rounded-xl text-[var(--text-main)] opacity-30 text-xs font-medium">
                    No site photo attached
                  </div>
                )}
              </div>

              {/* Materials */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-main)] opacity-40 font-bold mb-2 flex items-center gap-2">
                  <Package size={13} className="text-amber-500" /> Materials Supplied
                </p>
                {entry.materialsFormatted && entry.materialsFormatted.length > 0 ? (
                  <div className="rounded-xl border border-[var(--glass-border)] overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[var(--glass-bg-primary)] border-b border-[var(--glass-border)]">
                          <th className="text-left p-3 font-bold uppercase tracking-wider text-[var(--text-main)] opacity-50">Material</th>
                          <th className="text-right p-3 font-bold uppercase tracking-wider text-[var(--text-main)] opacity-50">Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.materialsFormatted.map((m: any, i: number) => (
                          <tr key={i} className="border-b border-[var(--glass-border)]/50 last:border-0">
                            <td className="p-3 font-medium text-[var(--text-main)]">{m.name}</td>
                            <td className="p-3 text-right font-bold text-amber-600">{m.quantity} {m.unit && <span className="opacity-50 font-normal">{m.unit}</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 border border-[var(--glass-border)] rounded-xl text-sm text-[var(--text-main)] opacity-40">
                    No materials recorded
                  </div>
                )}
              </div>

              {/* Follow-ups */}
              {entry.followUps && entry.followUps.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-main)] opacity-40 font-bold mb-2 flex items-center gap-2">
                    <Calendar size={13} className="text-cyan-500" /> Follow-Up Schedule
                  </p>
                  <div className="space-y-2">
                    {entry.followUps.map((fu: any, i: number) => (
                      <div key={i} className="p-3.5 rounded-xl border border-[var(--glass-border)] flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${fu.status === 'completed' ? 'bg-emerald-500/15 border-emerald-500/15' : 'bg-cyan-500/15 border-cyan-500/15'}`}>
                          <Calendar size={13} className={fu.status === 'completed' ? 'text-emerald-500' : 'text-cyan-500'} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-[var(--text-main)]">
                            {new Date(fu.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          {fu.notes && <p className="text-xs text-[var(--text-main)] opacity-50 mt-0.5">{fu.notes}</p>}
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${fu.status === 'completed' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-cyan-500/15 text-cyan-600'}`}>
                          {fu.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-main)] opacity-40 font-bold mb-2 flex items-center gap-2">
                  <FileText size={13} className="text-indigo-500" /> Additional Notes
                </p>
                <div className="p-4 border border-[var(--glass-border)] rounded-xl text-sm text-[var(--text-main)] opacity-70 leading-relaxed">
                  {notes}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-[var(--glass-border)] flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  onStatusUpdate(entry.id, 'REJECTED');
                  setIsOpen(false);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 border border-rose-500/30 text-rose-500 bg-rose-500/10 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <XCircle size={15} /> Decline
              </button>
              <button
                type="button"
                onClick={() => {
                  onStatusUpdate(entry.id, 'APPROVED');
                  setIsOpen(false);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <CheckCircle size={15} /> Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};