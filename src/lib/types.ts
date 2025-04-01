import { Timestamp } from "firebase/firestore";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  specs?: string;
  availability?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface DailyMix {
  id: string;
  productId: string;
  date: any; // Firestore Timestamp
  temperature: number;
  estimatedAvailableTime: any; // Firestore Timestamp
  estimatedEndTime: any; // Firestore Timestamp
  currentStatus: MixStatus;
  specialNotes?: string;
  isProducing: boolean;
  createdAt: any;
  updatedAt: any;
  
  // Production tonnage tracking
  estimatedTonnage?: number;        // Planned production amount
  currentTonnage?: number;          // Current produced amount
  finalTonnage?: number;            // Final production total
  tonnageLastUpdated?: any;         // Timestamp of last tonnage update
  tonnageUpdatedBy?: string;        // User ID of who last updated tonnage
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerId?: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "confirmed" | "dispatched" | "delivered" | "cancelled";
  paymentStatus?: "pending" | "paid" | "refunded";
  paymentMethod?: string;
  deliveryDate?: Timestamp;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  notes?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: "admin" | "manager" | "operator" | "customer";
  company?: string;
  phone?: string;
  createdAt: Timestamp;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  read: boolean;
  createdAt: Timestamp;
}

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  icon: string;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  forecast: {
    date: string;
    condition: string;
    temperature: {
      min: number;
      max: number;
    };
    precipitation: number;
  }[];
} 