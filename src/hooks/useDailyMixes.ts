'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DailyMix, Product } from '@/lib/types';

export function useDailyMixes() {
  const [mixes, setMixes] = useState<(DailyMix & { product?: Product })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchDailyMixes() {
      try {
        setLoading(true);
        
        // Get today's date (start of day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = Timestamp.fromDate(today);
        
        // Query daily mixes for today
        const q = query(
          collection(db, 'dailyMixes'),
          where('date', '>=', todayTimestamp),
          orderBy('date', 'asc')
        );
        
        const querySnapshot = await getDocs(q);
        
        // Process results
        const mixesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DailyMix[];
        
        // If there are mixes, get their associated products
        if (mixesData.length > 0) {
          // Get all product IDs from the mixes
          const productIds = [...new Set(mixesData.map(mix => mix.productId))];
          
          // Fetch all products in one query
          const productsQuery = query(
            collection(db, 'products'),
            where('id', 'in', productIds)
          );
          
          const productsSnapshot = await getDocs(productsQuery);
          
          // Create a map of product IDs to products
          const productsMap = new Map<string, Product>();
          productsSnapshot.docs.forEach(doc => {
            productsMap.set(doc.id, { id: doc.id, ...doc.data() } as Product);
          });
          
          // Join products with mixes
          const mixesWithProducts = mixesData.map(mix => ({
            ...mix,
            product: productsMap.get(mix.productId)
          }));
          
          setMixes(mixesWithProducts);
        } else {
          setMixes(mixesData);
        }
      } catch (err) {
        console.error('Error fetching daily mixes:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    fetchDailyMixes();
  }, []);

  return { mixes, loading, error };
} 