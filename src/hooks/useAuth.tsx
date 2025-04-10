export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'staff' | 'customer';
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  locationId?: string;
  createdAt?: Timestamp;
} 