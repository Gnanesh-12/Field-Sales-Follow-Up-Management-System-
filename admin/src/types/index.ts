export interface Employee {
  id: string;
  employee_id?: string;
  employeeId?: string;
  name: string;
  phone?: string;
  status: string;
  createdAt?: string;
}

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
  gpsLat?: number | null;
  gpsLng?: number | null;
  gpsAccuracy?: number | null;
  photoUrl?: string;
  imageUrl?: string;
  attachments?: { id: string; fileUrl: string; type: string }[];
  itemsNeeded?: string | string[];
  materials?: string | string[];
  materialsFormatted?: { name: string; unit: string; quantity: number }[];
  followUps?: { id: string; dueDate: string; status: string; notes?: string }[];
  notes?: string;
  remarks?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: string;
  timestamp?: string;
  customerSite?: { name: string };
  site?: { name: string };
}

export interface AddEmployeeForm {
  name: string;
  employeeId: string;
  phone: string;
  password: string;
}