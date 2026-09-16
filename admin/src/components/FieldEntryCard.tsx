import React, { useState, useMemo } from 'react';
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
  ChevronRight,
  AlertTriangle,
  Ban,
} from 'lucide-react';

interface FieldEntryCardProps {
  entry: any;
  onApprove: (id: any) => void;
  onDeny: (id: any, reason?: string) => void;
}

export const FieldEntryCard: React.FC<FieldEntryCardProps> = ({ entry, onApprove, onDeny }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  // ─── Confirmation / Denial dialog state ──────────────────────────────────
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showDenyDialog, setShowDenyDialog] = useState(false);
  const [denialReason, setDenialReason] = useState('');
  const [isActioning, setIsActioning] = useState(false);

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

  const rawPhotos: string[] = (
    entry.imageUrls?.length
      ? entry.imageUrls
      : (entry.attachments?.length
        ? entry.attachments.map((a: any) => a.fileUrl || a.url || a.filePath).filter(Boolean)
        : (Array.isArray(entry.photos) ? entry.photos : []))
  );
  if (rawPhotos.length === 0 && (entry.photoUrl || entry.imageUrl)) {
    rawPhotos.push(entry.photoUrl || entry.imageUrl);
  }

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

  const photoUrls = useMemo(
    () => rawPhotos.map((p) => formatImageUrl(p)).filter(Boolean) as string[],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entry.id, JSON.stringify(rawPhotos)]
  );
  const safeIndex = photoUrls.length > 0 ? photoIndex % photoUrls.length : 0;
  const photoUrl = photoUrls[safeIndex] || null;
  const hasMultiplePhotos = photoUrls.length > 1;

  const advancePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev + 1) % photoUrls.length);
  };

  const notes = entry.notes || entry.additionalNotes || 'No notes added for this visit.';
  const status = (entry.status || 'PENDING').toUpperCase();
  const isPending = status === 'PENDING';
  const isApproved = status === 'APPROVED';
  const isDenied = status === 'DENIED' || status === 'REJECTED';

  const statusConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
    APPROVED: { bg: 'bg-[var(--status-success-subtle)]', text: 'text-[var(--status-success)]', border: 'border-[var(--status-success-subtle)]', label: 'APPROVED' },
    DENIED: { bg: 'bg-[var(--status-error-subtle)]', text: 'text-[var(--status-error)]', border: 'border-[var(--status-error-subtle)]', label: 'DENIED' },
    REJECTED: { bg: 'bg-[var(--status-error-subtle)]', text: 'text-[var(--status-error)]', border: 'border-[var(--status-error-subtle)]', label: 'DENIED' },
    PENDING: { bg: 'bg-[var(--status-warning-subtle)]', text: 'text-[var(--status-warning)]', border: 'border-[var(--status-warning-subtle)]', label: 'PENDING' },
  };
  const st = statusConfig[status] || statusConfig['PENDING'];

  // ─── Action Handlers ───────────────────────────────────────────────────────
  const handleApproveConfirmed = async () => {
    setIsActioning(true);
    try {
      onApprove(entry.id);
      setShowApproveConfirm(false);
      setIsOpen(false);
    } finally {
      setIsActioning(false);
    }
  };

  const handleDenyConfirmed = async () => {
    setIsActioning(true);
    try {
      onDeny(entry.id, denialReason.trim() || undefined);
      setShowDenyDialog(false);
      setDenialReason('');
      setIsOpen(false);
    } finally {
      setIsActioning(false);
    }
  };

  const openDenyDialog = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDenialReason('');
    setShowDenyDialog(true);
  };

  const openApproveConfirm = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowApproveConfirm(true);
  };

  return (
    <>
      {/* ─── Entry Card ─────────────────────────────────── */}
      <div
        className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm hover:shadow-md hover:border-[var(--border-strong)] transition-all cursor-pointer group"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex flex-col sm:flex-row items-stretch">
          {/* Photo Thumbnail */}
          <div className="relative sm:w-44 w-full h-32 sm:h-auto shrink-0 bg-[var(--bg-app)] overflow-hidden rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none border-b sm:border-b-0 sm:border-r border-[var(--border-subtle)]">
            {photoUrl ? (
              <img
                key={photoUrl}
                src={photoUrl}
                alt="Site visit"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML =
                    '<div class="w-full h-full flex items-center justify-center"><svg class="text-[var(--text-tertiary)]" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--text-tertiary)]">
                <ImageIcon size={32} />
              </div>
            )}
            {hasMultiplePhotos && (
              <>
                <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {safeIndex + 1}/{photoUrls.length}
                </span>
                <button
                  type="button"
                  onClick={advancePhoto}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors cursor-pointer"
                  title="Next photo"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}
          </div>

          {/* Card Content */}
          <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Employee Info */}
            <div className="flex items-center gap-3 sm:w-52 shrink-0">
              <div className="w-10 h-10 rounded-lg bg-[var(--brand-subtle)] border border-[var(--brand-subtle-border)] flex items-center justify-center shrink-0">
                <User size={18} className="text-[var(--brand-primary)]" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-[var(--text-primary)] truncate">{empName}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{empId}</p>
              </div>
            </div>

            {/* Site & Location */}
            <div className="flex-1 min-w-0 border-l border-[var(--border-subtle)] pl-4">
              <div className="flex items-center gap-2 mb-1.5">
                <MapPin size={14} className="text-[var(--text-tertiary)] shrink-0" />
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{siteName}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] font-medium">
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-[var(--text-tertiary)]" /> {dateStr}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={12} className="text-[var(--text-tertiary)]" /> {timeStr}
                </span>
              </div>
              {entry.gpsLat && entry.gpsLng && (
                <p className="text-[10px] text-[var(--text-tertiary)] font-mono mt-1.5">
                  📍 {Number(entry.gpsLat).toFixed(4)}, {Number(entry.gpsLng).toFixed(4)}
                </p>
              )}
            </div>

            {/* Status + Action */}
            <div className="flex items-center gap-3 shrink-0">
              {entry.followUps && entry.followUps.length > 0 && (
                <div className="flex items-center gap-2 border-r border-[var(--border-subtle)] pr-3 mr-1">
                  {entry.followUps.every((f: any) => f.status === 'completed') ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--status-success)] bg-[var(--status-success-subtle)] px-2 py-1 rounded-md border border-[var(--status-success-subtle)]">
                      <CheckCircle size={12} /> Follow-up Completed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--status-warning)] bg-[var(--status-warning-subtle)] px-2 py-1 rounded-md border border-[var(--status-warning-subtle)]">
                      <Calendar size={12} /> Follow-up Pending
                    </span>
                  )}
                </div>
              )}
              <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${st.bg} ${st.text} ${st.border}`}>
                {st.label}
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-app)] text-[var(--text-secondary)] border border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] font-semibold text-xs rounded-md transition-colors cursor-pointer"
              >
                <Eye size={14} /> View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Detail Modal ─────────────────────────────── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
          <div
            className="bg-[var(--bg-surface)] w-full max-w-2xl flex flex-col max-h-[90vh] rounded-xl shadow-xl border border-[var(--border-strong)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-app)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--brand-subtle)] border border-[var(--brand-subtle-border)] flex items-center justify-center">
                  <User size={18} className="text-[var(--brand-primary)]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">{empName}</h3>
                  <span className="text-xs text-[var(--text-tertiary)] font-medium">{empId}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${st.bg} ${st.text} ${st.border}`}>
                  {st.label}
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">

              {/* ─── Approval Status Banner ─────────────────────────────────── */}
              {isPending && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--status-warning-subtle)] border border-[var(--status-warning-subtle)]">
                  <AlertTriangle size={18} className="text-[var(--status-warning)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-[var(--status-warning)]">Awaiting Approval</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">This field visit is pending your review. The employee cannot proceed with follow-up work until you approve.</p>
                  </div>
                </div>
              )}
              {isApproved && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--status-success-subtle)] border border-[var(--status-success-subtle)]">
                  <CheckCircle size={18} className="text-[var(--status-success)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-[var(--status-success)]">Field Visit Approved</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Employee can proceed with follow-up work.
                      {entry.approvedAt && <> Approved on {new Date(entry.approvedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}.</>}
                    </p>
                  </div>
                </div>
              )}
              {isDenied && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--status-error-subtle)] border border-[var(--status-error-subtle)]">
                  <Ban size={18} className="text-[var(--status-error)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-[var(--status-error)]">Field Visit Denied</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Employee cannot proceed with follow-up work.
                      {entry.deniedAt && <> Denied on {new Date(entry.deniedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}.</>}
                    </p>
                    {entry.denialReason && (
                      <p className="text-xs text-[var(--status-error)] mt-2 font-medium">
                        <span className="font-bold">Reason:</span> {entry.denialReason}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Date, Time & Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--bg-app)] border border-[var(--border-subtle)]">
                  <div className="p-2 bg-[var(--bg-surface)] rounded-md border border-[var(--border-strong)]">
                    <Calendar size={16} className="text-[var(--text-secondary)]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Date</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{dateStr}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--bg-app)] border border-[var(--border-subtle)]">
                  <div className="p-2 bg-[var(--bg-surface)] rounded-md border border-[var(--border-strong)]">
                    <Clock size={16} className="text-[var(--text-secondary)]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Time</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{timeStr}</p>
                  </div>
                </div>
              </div>

              {/* Customer Site & GPS */}
              <div className="p-4 rounded-lg bg-[var(--bg-app)] border border-[var(--border-subtle)]">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[var(--bg-surface)] rounded-md border border-[var(--border-strong)] shrink-0">
                    <MapPin size={16} className="text-[var(--text-secondary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Customer Site</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{siteName}</p>
                    {entry.gpsLat && entry.gpsLng && (
                      <a
                        href={`https://www.google.com/maps?q=${entry.gpsLat},${entry.gpsLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 text-xs text-[var(--brand-primary)] hover:underline font-medium"
                      >
                        <MapPin size={12} />
                        {Number(entry.gpsLat).toFixed(6)}, {Number(entry.gpsLng).toFixed(6)}
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Site Image */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                  <ImageIcon size={14} className="text-[var(--text-tertiary)]" /> Site Photo{photoUrls.length > 1 ? 's' : ''}
                </p>
                {photoUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-[var(--border-subtle)] shadow-sm aspect-video max-h-64 bg-[var(--bg-app)] flex items-center justify-center">
                    <img
                      key={photoUrl}
                      src={photoUrl}
                      alt="Field Visit"
                      className="w-full h-full object-contain"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                    {hasMultiplePhotos && (
                      <>
                        <span className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                          {safeIndex + 1} / {photoUrls.length}
                        </span>
                        <button
                          type="button"
                          onClick={advancePhoto}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors cursor-pointer"
                          title="Next photo"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center border-2 border-dashed border-[var(--border-subtle)] rounded-lg text-[var(--text-tertiary)] text-sm font-medium">
                    No site photo attached
                  </div>
                )}
              </div>

              {/* Materials */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                  <Package size={14} className="text-[var(--text-tertiary)]" /> Materials Supplied
                </p>
                {entry.materialsFormatted && entry.materialsFormatted.length > 0 ? (
                  <div className="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="bg-[var(--bg-app)] border-b border-[var(--border-subtle)]">
                          <th className="p-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">Material</th>
                          <th className="p-3 text-right font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">Quantity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--bg-surface)]">
                        {entry.materialsFormatted.map((m: any, i: number) => (
                          <tr key={i}>
                            <td className="p-3 font-medium text-[var(--text-primary)]">{m.name}</td>
                            <td className="p-3 text-right font-semibold text-[var(--text-primary)]">{m.quantity} {m.unit && <span className="text-[var(--text-tertiary)] font-normal ml-1">{m.unit}</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 border-2 border-dashed border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-tertiary)] font-medium text-center">
                    No materials recorded
                  </div>
                )}
              </div>

              {/* Follow-ups */}
              {entry.followUps && entry.followUps.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                    <Calendar size={14} className="text-[var(--text-tertiary)]" /> Follow-Up Schedule
                  </p>
                  <div className="space-y-3">
                    {entry.followUps.map((fu: any, i: number) => (
                      <div key={i} className="p-4 rounded-lg bg-[var(--bg-app)] border border-[var(--border-subtle)] flex items-start sm:items-center flex-col sm:flex-row gap-3">
                        <div className={`p-2 rounded-md border shrink-0 ${fu.status === 'completed' ? 'bg-[var(--status-success-subtle)] border-[var(--status-success-subtle)]' : 'bg-[var(--bg-surface)] border-[var(--border-strong)]'}`}>
                          <Calendar size={16} className={fu.status === 'completed' ? 'text-[var(--status-success)]' : 'text-[var(--text-secondary)]'} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            {new Date(fu.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          {fu.notes && <p className="text-xs text-[var(--text-secondary)] mt-1">{fu.notes}</p>}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${fu.status === 'completed' ? 'bg-[var(--status-success-subtle)] text-[var(--status-success)] border-[var(--status-success-subtle)]' : 'bg-[var(--status-warning-subtle)] text-[var(--status-warning)] border-[var(--status-warning-subtle)]'}`}>
                          {fu.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                  <FileText size={14} className="text-[var(--text-tertiary)]" /> Additional Notes
                </p>
                <div className="p-4 border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-primary)] leading-relaxed bg-[var(--bg-app)]">
                  {notes}
                </div>
              </div>
            </div>

            {/* Modal Actions — Only shown for PENDING visits */}
            {isPending && (
              <div className="px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-[var(--text-tertiary)] font-medium">Review this field visit and take action:</p>
                <div className="flex items-center gap-3">
                  <button
                    id={`deny-btn-${entry.id}`}
                    type="button"
                    onClick={() => openDenyDialog()}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 border border-[var(--status-error)]/30 text-[var(--status-error)] bg-[var(--status-error-subtle)] hover:bg-[var(--status-error)] hover:text-white rounded-md text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <XCircle size={16} /> Deny
                  </button>
                  <button
                    id={`approve-btn-${entry.id}`}
                    type="button"
                    onClick={() => openApproveConfirm()}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--status-success-subtle)] border border-[var(--status-success)]/30 text-[var(--status-success)] hover:bg-[var(--status-success)] hover:text-white rounded-md text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                </div>
              </div>
            )}
            {!isPending && (
              <div className="px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 bg-[var(--bg-app)] border border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-md text-sm font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Approve Confirmation Dialog ──────────────────── */}
      {showApproveConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150" onClick={() => setShowApproveConfirm(false)}>
          <div
            className="bg-[var(--bg-surface)] w-full max-w-md rounded-xl shadow-2xl border border-[var(--border-strong)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[var(--status-success-subtle)] border border-[var(--status-success-subtle)] flex items-center justify-center">
                  <CheckCircle size={22} className="text-[var(--status-success)]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Approve Field Visit?</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{empName} · {siteName}</p>
                </div>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Approving this field visit will allow <strong className="text-[var(--text-primary)]">{empName}</strong> to proceed with the associated follow-up work. This action cannot be easily undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-app)] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowApproveConfirm(false)}
                className="px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id={`confirm-approve-${entry.id}`}
                type="button"
                disabled={isActioning}
                onClick={handleApproveConfirmed}
                className="flex items-center gap-2 px-5 py-2 bg-[var(--status-success)] text-white hover:opacity-90 rounded-md text-sm font-semibold transition-opacity cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <CheckCircle size={16} /> {isActioning ? 'Approving...' : 'Yes, Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Deny Dialog (with reason input) ─────────────── */}
      {showDenyDialog && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150" onClick={() => setShowDenyDialog(false)}>
          <div
            className="bg-[var(--bg-surface)] w-full max-w-md rounded-xl shadow-2xl border border-[var(--border-strong)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[var(--status-error-subtle)] border border-[var(--status-error-subtle)] flex items-center justify-center">
                  <Ban size={22} className="text-[var(--status-error)]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Deny Field Visit?</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{empName} · {siteName}</p>
                </div>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                Denying this field visit will block <strong className="text-[var(--text-primary)]">{empName}</strong> from proceeding with follow-up work. The employee will see the denied status.
              </p>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                  Denial Reason <span className="text-[var(--text-tertiary)] font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  id={`denial-reason-${entry.id}`}
                  value={denialReason}
                  onChange={(e) => setDenialReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why this visit is being denied..."
                  className="w-full px-3 py-2.5 bg-[var(--bg-app)] border border-[var(--border-strong)] rounded-md text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--status-error)] focus:ring-1 focus:ring-[var(--status-error)] transition-all resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-app)] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowDenyDialog(false); setDenialReason(''); }}
                className="px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id={`confirm-deny-${entry.id}`}
                type="button"
                disabled={isActioning}
                onClick={handleDenyConfirmed}
                className="flex items-center gap-2 px-5 py-2 bg-[var(--status-error)] text-white hover:opacity-90 rounded-md text-sm font-semibold transition-opacity cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <XCircle size={16} /> {isActioning ? 'Denying...' : 'Yes, Deny Visit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};