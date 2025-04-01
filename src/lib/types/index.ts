import { Timestamp } from "firebase/firestore";

// User types
export type UserRole = 'customer' | 'staff' | 'admin';

export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface PaymentMethod {
  id: string;
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export interface User {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  role: UserRole;
  defaultDeliveryAddress?: DeliveryAddress;
  paymentMethods: PaymentMethod[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Guest user types
export interface GuestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  deliveryAddress: DeliveryAddress;
  paymentMethodId?: string;
  createdAt: Timestamp;
  lastOrderDate: Timestamp;
}

// Product types
export type ProductType = 'asphalt_mix' | 'secondary';
export type ProductUnit = 'ton' | 'each' | 'gallon';

export interface ProductSpecs {
  odotApproved: boolean;
  specNumber: string;
  maxAggregateSize?: number;
}

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  description: string;
  specs: ProductSpecs;
  pricePerUnit: number;
  unit: ProductUnit;
  minOrderQuantity: number;
  imageUrl: string;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Daily Mix types
export type MixStatus = 'scheduled' | 'producing' | 'complete' | 'canceled';

export interface DailyMix {
  id: string;
  productId: string;
  date: Timestamp;
  isProducing: boolean;
  temperature: number;
  estimatedAvailableTime: Timestamp;
  estimatedEndTime: Timestamp;
  currentStatus: MixStatus;
  specialNotes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Order types
export type CustomerType = 'guest' | 'registered' | 'credit_account';
export type OrderStatus = 'pending' | 'confirmed' | 'in_production' | 'loaded' | 'in_transit' | 'delivered' | 'completed' | 'canceled';
export type PaymentStatus = 'authorized' | 'captured' | 'refunded' | 'failed';
export type CreditAccountPaymentStatus = 'pending' | 'invoiced' | 'paid';

export interface OrderItem {
  productId: string;
  name: string;
  type: string;
  pricePerUnit: number;
  estimatedQuantity: number;
  actualQuantity?: number;
  unit: string;
}

export interface DeliveryDetails {
  address: DeliveryAddress;
  requestedDate: Timestamp;
  requestedTimeWindow: string;
  scheduledTime?: Timestamp;
  specialInstructions: string;
}

export interface PaymentDetails {
  paymentMethodId: string;
  paymentIntentId: string;
  estimatedTotal: number;
  authorizedAmount: number;
  actualTotal?: number;
  status: PaymentStatus;
  capturedAt?: Timestamp;
}

export interface CreditAccountDetails {
  accountId: string;
  invoiceId?: string;
  estimatedTotal: number;
  actualTotal?: number;
  status: CreditAccountPaymentStatus;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: Timestamp;
  note: string;
  userId: string;
}

export interface Order {
  id: string;
  userId?: string;
  guestUserId?: string;
  customerType: CustomerType;
  items: OrderItem[];
  delivery: DeliveryDetails;
  payment: PaymentDetails | CreditAccountDetails;
  status: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Credit Account types
export type CreditAccountStatus = 'active' | 'on_hold' | 'suspended';

export interface CreditAccount {
  id: string;
  companyName: string;
  creditLimit: number;
  availableCredit: number;
  terms: string;
  status: CreditAccountStatus;
  lastSyncedAt: Timestamp;
}

// Invoice types
export type InvoiceStatus = 'pending' | 'issued' | 'paid' | 'overdue' | 'canceled';

export interface ErpInvoice {
  id: string;
  orderId: string;
  customerId: string;
  invoiceDate: Timestamp;
  dueDate: Timestamp;
  amount: number;
  status: InvoiceStatus;
  syncedAt: Timestamp;
} 