'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, ProductType } from '@/lib/types';

interface UseProductsOptions {
  type?: ProductType;
  category?: string; // Now this is a filter field, not a collection path
  limit?: number;
  orderByField?: keyof Product;
  orderDirection?: 'asc' | 'desc';
}

export function useProducts({
  type,
  category,
  limit: queryLimit = 10,
  orderByField = 'createdAt',
  orderDirection = 'desc'
}: UseProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        
        // Get a reference to the products collection (it's flat, not nested)
        const productsCollection = collection(db, 'products');
        
        // Build constraints array
        const constraints = [];
        
        // Add category filter if provided
        if (category) {
          constraints.push(where('category', '==', category));
        }
        
        // Add type filter if provided
        if (type) {
          constraints.push(where('type', '==', type));
        }
        
        // Add ordering
        constraints.push(orderBy(orderByField, orderDirection));
        
        // Add limit
        constraints.push(limit(queryLimit));
        
        // Create and execute query
        const q = query(productsCollection, ...constraints);
        const querySnapshot = await getDocs(q);
        
        // Process results
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        
        setProducts(productsData);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [type, category, queryLimit, orderByField, orderDirection]);

  return { products, loading, error };
} 