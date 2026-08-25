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
      <tr className="hover:bg-gray-50/80 transition border-b border-gray-100 text-sm">
        <td className="p-4 font-mono font-bold text-gray-900">{empId}</td>
        <td className="p-4 font-medium text-gray-800">{empName}</td>
        <td className="p-4 text-gray-500 font-medium">
          {dateStr} at {timeStr}
        </td>
        <td className="p-4">
          <span
            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium text-xs rounded-lg transition cursor-pointer"
          >
            <Eye size={15} /> View
          </button>
        </td>
      </tr>

      {/* Detail Pop-up Card Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2.5 py-1 bg-blue-100 text-blue-800 rounded-md font-bold">
                  {empId}
                </span>
                <h3 className="text-base font-bold text-gray-900">{empName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-left">
              {/* Date, Time & Geographical Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar size={15} className="text-blue-500 shrink-0" />
                  <span>{dateStr}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-700">
                  <Clock size={15} className="text-purple-500 shrink-0" />
                  <span>{timeStr}</span>
                </div>

                <div className="sm:col-span-2 flex items-start gap-2 text-gray-700 pt-2 border-t border-slate-200/60">
                  <MapPin size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-gray-900 block">Geographical Location</span>
                    <span className="text-gray-600">{location}</span>
                  </div>
                </div>
              </div>

              {/* Uploaded Site Image */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-blue-500" /> Uploaded Site Picture
                </label>
                {photoUrl ? (
                  <div className="rounded-xl overflow-hidden border border-gray-200 aspect-video max-h-56 bg-slate-900 flex items-center justify-center">
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
                  <div className="p-6 text-center bg-gray-50 border border-dashed rounded-xl text-gray-400 text-xs">
                    No site photo attached to this visit.
                  </div>
                )}
              </div>

              {/* Items & Quantity */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Package size={14} className="text-amber-500" /> Items & Quantity Needed
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800">
                  {items}
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <FileText size={14} className="text-indigo-500" /> Additional Notes
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 leading-relaxed">
                  {notes}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Status:{' '}
                <strong className="text-gray-800 uppercase">
                  {status === 'REJECTED' ? 'DECLINED' : status}
                </strong>
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onStatusUpdate(entry.id, 'REJECTED');
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 border border-rose-200 text-rose-700 bg-white hover:bg-rose-50 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  <XCircle size={15} /> Decline
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onStatusUpdate(entry.id, 'APPROVED');
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-sm cursor-pointer"
                >
                  <CheckCircle size={15} /> Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};