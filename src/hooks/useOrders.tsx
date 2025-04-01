'use client';

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  Timestamp 
} from "firebase/firestore";
import { Order } from "@/lib/types";

export function useOrders(userId?: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let ordersQuery;
      if (userId) {
        // Fetch user-specific orders
        ordersQuery = query(
          collection(db, "orders"),
          where("customerId", "==", userId),
          orderBy("createdAt", "desc")
        );
      } else {
        // Fetch all orders (for admin)
        ordersQuery = query(
          collection(db, "orders"),
          orderBy("createdAt", "desc")
        );
      }
      
      const querySnapshot = await getDocs(ordersQuery);
      
      const fetchedOrders: Order[] = [];
      querySnapshot.forEach((doc) => {
        fetchedOrders.push({
          id: doc.id,
          customerName: doc.data().customerName,
          customerEmail: doc.data().customerEmail,
          customerId: doc.data().customerId,
          items: doc.data().items,
          total: doc.data().total,
          status: doc.data().status,
          paymentStatus: doc.data().paymentStatus,
          paymentMethod: doc.data().paymentMethod,
          deliveryDate: doc.data().deliveryDate,
          deliveryAddress: doc.data().deliveryAddress,
          notes: doc.data().notes,
          createdAt: doc.data().createdAt as Timestamp,
          updatedAt: doc.data().updatedAt as Timestamp,
        });
      });
      
      setOrders(fetchedOrders);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to fetch orders. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getOrder = async (orderId: string) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (orderSnap.exists()) {
        return {
          id: orderSnap.id,
          ...orderSnap.data()
        } as Order;
      } else {
        throw new Error("Order not found");
      }
    } catch (err) {
      console.error("Error fetching order:", err);
      throw err;
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status,
        updatedAt: Timestamp.now(),
      });
      
      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status, updatedAt: Timestamp.now() } : order
        )
      );
      
      return { success: true };
    } catch (err) {
      console.error("Error updating order status:", err);
      return { success: false, error: err };
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, "orders", orderId));
      
      // Update local state
      setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId));
      
      return { success: true };
    } catch (err) {
      console.error("Error deleting order:", err);
      return { success: false, error: err };
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userId]);

  return {
    orders,
    isLoading,
    error,
    refetch: fetchOrders,
    getOrder,
    updateOrderStatus,
    deleteOrder,
  };
} 