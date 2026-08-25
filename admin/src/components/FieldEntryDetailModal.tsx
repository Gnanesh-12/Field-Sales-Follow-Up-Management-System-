import React from 'react';
import { X, CheckCircle, XCircle, MapPin, Package, FileText, User } from 'lucide-react';
import { FieldEntry } from '../types';

interface FieldEntryDetailModalProps {
  isOpen: boolean;
  entry: FieldEntry | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: 'APPROVED' | 'REJECTED') => void;
}

export const FieldEntryDetailModal: React.FC<FieldEntryDetailModalProps> = ({
  isOpen,
  entry,
  onClose,
  onUpdateStatus,
}) => {
  if (!isOpen || !entry) return null;

  const empId = entry.employee?.id || entry.employeeId || 'N/A';
  const empName = entry.employee?.name || 'Unknown';
  const place = entry.siteName || entry.location || entry.address || 'Field Site';
  const photo = entry.photoUrl || entry.imageUrl;
  const notes = entry.notes || entry.remarks || 'No notes provided by the field sales agent.';

  // Normalize items needed whether stored as string, JSON, or array
  let itemsList: string[] = [];
  const rawItems = entry.itemsNeeded || entry.materials;
  if (Array.isArray(rawItems)) {
    itemsList = rawItems;
  } else if (typeof rawItems === 'string') {
    try {
      const parsed = JSON.parse(rawItems);
      itemsList = Array.isArray(parsed) ? parsed : [rawItems];
    } catch {
      itemsList = rawItems.split(',').map((i) => i.trim()).filter(Boolean);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Field Entry Review</h3>
            <p className="text-xs text-gray-500">ID: {entry.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-gray-700">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <User size={18} />
              </div>
              <div>
                <span className="text-xs text-gray-400 font-medium uppercase">Employee</span>
                <p className="font-semibold text-gray-900">{empName}</p>
                <p className="text-xs font-mono text-gray-500">{empId}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <MapPin size={18} />
              </div>
              <div>
                <span className="text-xs text-gray-400 font-medium uppercase">Location</span>
                <p className="font-semibold text-gray-900">{place}</p>
              </div>
            </div>
          </div>

          {/* Uploaded Site Photo */}
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
              Uploaded Site Picture
            </span>
            {photo ? (
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-black/5 aspect-video flex items-center justify-center">
                <img
                  src={photo.startsWith('http') ? photo : `http://localhost:3000${photo}`}
                  alt="Site Visit"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 border border-dashed rounded-xl text-gray-400 text-xs">
                No site picture attached to this record
              </div>
            )}
          </div>

          {/* Items Needed */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package size={16} className="text-blue-600" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Items / Materials Needed
              </span>
            </div>
            {itemsList.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {itemsList.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-50 text-blue-800 text-xs font-medium rounded-lg border border-blue-100"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No specific items requested.</p>
            )}
          </div>

          {/* Field Notes */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-purple-600" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Field Visit Notes
              </span>
            </div>
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs leading-relaxed text-gray-800">
              {notes}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="text-xs font-semibold text-gray-500">
            Current Status:{' '}
            <span
              className={`uppercase font-bold ${
                entry.status === 'APPROVED'
                  ? 'text-emerald-600'
                  : entry.status === 'REJECTED'
                  ? 'text-rose-600'
                  : 'text-amber-600'
              }`}
            >
              {entry.status || 'PENDING'}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onUpdateStatus(entry.id, 'REJECTED')}
              className="flex items-center gap-1.5 px-4 py-2 border border-rose-200 text-rose-700 bg-white hover:bg-rose-50 rounded-xl font-medium text-xs transition"
            >
              <XCircle size={16} /> Reject
            </button>
            <button
              type="button"
              onClick={() => onUpdateStatus(entry.id, 'APPROVED')}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-xs shadow-sm transition"
            >
              <CheckCircle size={16} /> Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};