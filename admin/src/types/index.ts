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
  photoUrl?: string;
  imageUrl?: string;
  itemsNeeded?: string | string[];
  materials?: string | string[];
  notes?: string;
  remarks?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: string;
}

export interface AddEmployeeForm {
  name: string;
  employeeId: string;
  phone: string;
  password: string;
}