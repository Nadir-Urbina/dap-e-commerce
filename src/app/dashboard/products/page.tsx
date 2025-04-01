'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/auth-provider';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  ChevronRight,
  Layers,
  Wrench,
  AlertTriangle,
  ArrowRight,
  BarChart
} from 'lucide-react';
import { toast } from 'sonner';

// Stats type
interface ProductStats {
  asphaltTotal: number;
  asphaltActive: number;
  equipmentTotal: number;
  equipmentActive: number;
  recentlyAdded: {
    name: string;
    category: string;
    date: Date;
  }[];
  lowStock?: {
    name: string;
    quantity: number;
  }[];
}

export default function ProductsPage() {
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { userData } = useAuthContext();

  // Redirect if user doesn't have admin role
  useEffect(() => {
    if (userData && userData.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [userData, router]);

  // Fetch product stats from Firestore
  useEffect(() => {
    async function fetchProductStats() {
      try {
        setIsLoading(true);
        
        // Get all products
        const productsRef = collection(db, 'products');
        const productsSnapshot = await getDocs(productsRef);
        const products = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // Calculate stats
        const asphaltProducts = products.filter(
          product => product.category === 'HMA' || product.category === 'RAP' || product.category === 'Asphalt'
        );
        const equipmentProducts = products.filter(
          product => product.category === 'Equipment' || product.category === 'Parts' || product.category === 'Hardware'
        );
        
        // Get recently added products (last 5)
        const recentlyAdded = products
          .sort((a, b) => {
            // Handle Firestore timestamps or JS Dates
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt;
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt;
            return dateB - dateA;
          })
          .slice(0, 5)
          .map(product => ({
            name: product.name,
            category: product.category,
            date: product.createdAt?.toDate ? product.createdAt.toDate() : new Date(product.createdAt)
          }));
        
        // Construct stats object
        const productStats: ProductStats = {
          asphaltTotal: asphaltProducts.length,
          asphaltActive: asphaltProducts.filter(p => p.isActive).length,
          equipmentTotal: equipmentProducts.length,
          equipmentActive: equipmentProducts.filter(p => p.isActive).length,
          recentlyAdded,
          // If you implement inventory tracking in the future
          lowStock: [] 
        };
        
        setStats(productStats);
      } catch (error) {
        console.error('Error fetching product stats:', error);
        toast.error('Failed to load product statistics');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProductStats();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 text-[#EFCD00] animate-spin" />
        <span className="ml-2 text-lg text-white">Loading product dashboard...</span>
      </div>
    );
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Products Dashboard</h1>
          <p className="text-white opacity-70">Manage all your product offerings</p>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/products/asphalt')}
            className="border-white/30 text-white hover:bg-white/10 hover:text-white"
          >
            <Layers className="h-4 w-4 mr-2" />
            Asphalt Products
          </Button>
          <Button
            onClick={() => router.push('/dashboard/products/equipment')}
            className="bg-[#EFCD00] hover:bg-[#EFCD00]/90 text-black"
          >
            <Wrench className="h-4 w-4 mr-2" />
            Equipment & Parts
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Asphalt Products Card */}
        <Card className="bg-[#121212] border-gray-800 text-white hover:border-[#EFCD00]/50 transition-colors duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl">Asphalt Products</CardTitle>
              <CardDescription className="text-white opacity-70">
                Hot mix asphalt and related products
              </CardDescription>
            </div>
            <Layers className="h-6 w-6 text-[#EFCD00]" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-400">Total Products</p>
                <p className="text-3xl font-bold text-white">{stats?.asphaltTotal || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-400">Active Products</p>
                <p className="text-3xl font-bold text-white">{stats?.asphaltActive || 0}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="ghost" 
              onClick={() => router.push('/dashboard/products/asphalt')}
              className="w-full text-white hover:bg-white/10"
            >
              Manage Asphalt Products
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardFooter>
        </Card>

        {/* Equipment & Parts Card */}
        <Card className="bg-[#121212] border-gray-800 text-white hover:border-[#EFCD00]/50 transition-colors duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl">Equipment & Parts</CardTitle>
              <CardDescription className="text-white opacity-70">
                Tools, equipment, and spare parts
              </CardDescription>
            </div>
            <Wrench className="h-6 w-6 text-[#EFCD00]" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-400">Total Products</p>
                <p className="text-3xl font-bold text-white">{stats?.equipmentTotal || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-400">Active Products</p>
                <p className="text-3xl font-bold text-white">{stats?.equipmentActive || 0}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="ghost" 
              onClick={() => router.push('/dashboard/products/equipment')}
              className="w-full text-white hover:bg-white/10"
            >
              Manage Equipment & Parts
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Secondary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recently Added Products */}
        <Card className="bg-[#121212] border-gray-800 text-white md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recently Added Products</CardTitle>
            <CardDescription className="text-white opacity-70">
              The latest products added to your catalog
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentlyAdded && stats.recentlyAdded.length > 0 ? (
              <div className="space-y-4">
                {stats.recentlyAdded.map((product, index) => (
                  <div key={index} className="flex justify-between items-center border-b border-gray-800 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-white">{product.name}</p>
                      <p className="text-sm text-gray-400">Category: {product.category}</p>
                    </div>
                    <p className="text-sm text-gray-400">{formatDate(product.date)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <p>No products have been added recently.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/dashboard/products/asphalt')}
              className="text-white hover:bg-white/10"
            >
              View Asphalt Products
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => router.push('/dashboard/products/equipment')}
              className="text-white hover:bg-white/10"
            >
              View Equipment
            </Button>
          </CardFooter>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-[#121212] border-gray-800 text-white">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription className="text-white opacity-70">
              Frequently used product management actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/products/asphalt?action=add')}
              className="w-full justify-start text-white border-gray-700 hover:bg-white/10 hover:border-white/30"
            >
              <Layers className="h-4 w-4 mr-2 text-[#EFCD00]" />
              Add New Asphalt Mix
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/products/equipment?action=add')}
              className="w-full justify-start text-white border-gray-700 hover:bg-white/10 hover:border-white/30"
            >
              <Wrench className="h-4 w-4 mr-2 text-[#EFCD00]" />
              Add New Equipment
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/daily-mixes')}
              className="w-full justify-start text-white border-gray-700 hover:bg-white/10 hover:border-white/30"
            >
              <BarChart className="h-4 w-4 mr-2 text-[#EFCD00]" />
              Daily Mix Schedule
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 