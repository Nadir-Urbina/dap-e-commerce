'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/auth-provider';
import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp 
} from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  BarChart4,
  TrendingUp,
  BarChart,
  LineChart,
  CircleDollarSign,
  Scale,
  Calendar,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsData {
  dailyProduction: {
    date: string;
    tons: number;
  }[];
  monthlySales: {
    month: string;
    revenue: number;
  }[];
  topProducts: {
    name: string;
    tons: number;
    revenue: number;
  }[];
  metrics: {
    totalTons: number;
    totalRevenue: number;
    averagePrice: number;
    ordersCompleted: number;
    activeProducts: number;
  };
}

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  
  const router = useRouter();
  const { userData } = useAuthContext();

  // Redirect if user doesn't have admin role
  useEffect(() => {
    if (userData && userData.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [userData, router]);

  // Fetch analytics data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      
      try {
        // In a real implementation, this would fetch actual data from Firestore
        // For now, we'll use mock data for demonstration purposes
        const mockData: AnalyticsData = {
          dailyProduction: [
            { date: '2025-01-01', tons: 120 },
            { date: '2025-01-02', tons: 145 },
            { date: '2025-01-03', tons: 132 },
            { date: '2025-01-04', tons: 110 },
            { date: '2025-01-05', tons: 95 },
            { date: '2025-01-06', tons: 150 },
            { date: '2025-01-07', tons: 165 }
          ],
          monthlySales: [
            { month: 'Jan', revenue: 125000 },
            { month: 'Feb', revenue: 135000 },
            { month: 'Mar', revenue: 165000 },
            { month: 'Apr', revenue: 190000 },
            { month: 'May', revenue: 210000 },
            { month: 'Jun', revenue: 250000 }
          ],
          topProducts: [
            { name: 'Surface Mix SP 9.5mm', tons: 950, revenue: 76000 },
            { name: 'Structural Mix SP 19mm', tons: 850, revenue: 72250 },
            { name: 'Base Mix SP 25mm', tons: 750, revenue: 60000 },
            { name: 'RAP 100% Recycled', tons: 550, revenue: 27500 },
            { name: 'Open Graded FC 12.5mm', tons: 450, revenue: 40500 }
          ],
          metrics: {
            totalTons: 3550,
            totalRevenue: 276250,
            averagePrice: 77.82,
            ordersCompleted: 125,
            activeProducts: 12
          }
        };
        
        setAnalyticsData(mockData);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [timeRange]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format number with commas
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 text-[#EFCD00] animate-spin" />
        <span className="ml-2 text-lg text-white">Loading analytics data...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-white opacity-70">Track your production and sales performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-[#121212] border border-gray-800 rounded-md p-1">
            <Button
              variant={timeRange === '7d' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('7d')}
              className="text-white text-xs"
            >
              7D
            </Button>
            <Button
              variant={timeRange === '30d' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('30d')}
              className="text-white text-xs"
            >
              30D
            </Button>
            <Button
              variant={timeRange === '90d' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('90d')}
              className="text-white text-xs"
            >
              90D
            </Button>
            <Button
              variant={timeRange === '1y' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('1y')}
              className="text-white text-xs"
            >
              1Y
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="border-white/30 text-white hover:bg-white/10 hover:text-white"
          >
            <Calendar className="h-4 w-4 mr-1" />
            <span className="hidden md:inline">Custom Range</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="border-white/30 text-white hover:bg-white/10 hover:text-white"
          >
            <Download className="h-4 w-4 mr-1" />
            <span className="hidden md:inline">Export</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-[#121212] border border-gray-800 p-0.5">
          <TabsTrigger value="overview" className="px-4 py-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="production" className="px-4 py-2">
            Production
          </TabsTrigger>
          <TabsTrigger value="sales" className="px-4 py-2">
            Sales
          </TabsTrigger>
          <TabsTrigger value="products" className="px-4 py-2">
            Products
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card className="bg-[#121212] border-gray-800 text-white">
              <CardHeader className="pb-2">
                <CardDescription className="text-white opacity-70">Total Production</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold text-white">
                    {analyticsData?.metrics.totalTons.toLocaleString()} tons
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-sm text-green-500 mt-1">↑ 12.5% from last period</p>
              </CardContent>
            </Card>

            <Card className="bg-[#121212] border-gray-800 text-white">
              <CardHeader className="pb-2">
                <CardDescription className="text-white opacity-70">Total Revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(analyticsData?.metrics.totalRevenue || 0)}
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-sm text-green-500 mt-1">↑ 8.3% from last period</p>
              </CardContent>
            </Card>

            <Card className="bg-[#121212] border-gray-800 text-white">
              <CardHeader className="pb-2">
                <CardDescription className="text-white opacity-70">Avg. Price per Ton</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold text-white">
                    ${analyticsData?.metrics.averagePrice.toFixed(2)}
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-sm text-green-500 mt-1">↑ 2.1% from last period</p>
              </CardContent>
            </Card>

            <Card className="bg-[#121212] border-gray-800 text-white">
              <CardHeader className="pb-2">
                <CardDescription className="text-white opacity-70">Orders Completed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold text-white">
                    {analyticsData?.metrics.ordersCompleted}
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-sm text-green-500 mt-1">↑ 5.8% from last period</p>
              </CardContent>
            </Card>

            <Card className="bg-[#121212] border-gray-800 text-white">
              <CardHeader className="pb-2">
                <CardDescription className="text-white opacity-70">Active Products</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold text-white">
                    {analyticsData?.metrics.activeProducts}
                  </div>
                  <Scale className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-sm text-blue-500 mt-1">No change from last period</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-[#121212] border-gray-800 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Daily Production</CardTitle>
                <CardDescription className="text-white opacity-70">
                  Daily asphalt production in tons
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <BarChart className="h-16 w-16 text-[#EFCD00]/50 mx-auto mb-4" />
                  <p className="text-white opacity-70">
                    Chart visualization would display here with actual data.
                  </p>
                  <p className="text-sm text-white opacity-50 mt-2">
                    Showing data for the last {timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : timeRange === '90d' ? '90 days' : 'year'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#121212] border-gray-800 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Monthly Revenue</CardTitle>
                <CardDescription className="text-white opacity-70">
                  Revenue trends over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <LineChart className="h-16 w-16 text-[#EFCD00]/50 mx-auto mb-4" />
                  <p className="text-white opacity-70">
                    Chart visualization would display here with actual data.
                  </p>
                  <p className="text-sm text-white opacity-50 mt-2">
                    Showing data for the last {timeRange === '7d' ? 'week' : timeRange === '30d' ? 'month' : timeRange === '90d' ? '3 months' : 'year'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Products Table */}
          <Card className="bg-[#121212] border-gray-800 text-white">
            <CardHeader>
              <CardTitle className="text-lg">Top Performing Products</CardTitle>
              <CardDescription className="text-white opacity-70">
                Products with highest sales volume and revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="text-xs text-white opacity-80 uppercase bg-[#1a1a1a]">
                    <tr>
                      <th scope="col" className="px-6 py-3">Product Name</th>
                      <th scope="col" className="px-6 py-3 text-right">Volume (tons)</th>
                      <th scope="col" className="px-6 py-3 text-right">Revenue</th>
                      <th scope="col" className="px-6 py-3 text-right">Avg. Price/Ton</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData?.topProducts.map((product, index) => (
                      <tr key={index} className="border-b border-gray-800">
                        <td className="px-6 py-4 text-white font-medium">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 text-white opacity-80 text-right">
                          {formatNumber(product.tons)}
                        </td>
                        <td className="px-6 py-4 text-white opacity-80 text-right">
                          {formatCurrency(product.revenue)}
                        </td>
                        <td className="px-6 py-4 text-white opacity-80 text-right">
                          ${(product.revenue / product.tons).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Production Tab */}
        <TabsContent value="production" className="space-y-4">
          <Card className="bg-[#121212] border-gray-800 text-white h-96 flex items-center justify-center">
            <CardContent className="text-center">
              <BarChart4 className="h-16 w-16 text-[#EFCD00]/50 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Production Analytics</h3>
              <p className="text-white opacity-70">
                Detailed production analytics will be implemented here.
                <br />
                This would include daily production rates, plant efficiency, and material usage.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-4">
          <Card className="bg-[#121212] border-gray-800 text-white h-96 flex items-center justify-center">
            <CardContent className="text-center">
              <CircleDollarSign className="h-16 w-16 text-[#EFCD00]/50 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Sales Analytics</h3>
              <p className="text-white opacity-70">
                Detailed sales analytics will be implemented here.
                <br />
                This would include revenue by customer, order volume trends, and payment analytics.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card className="bg-[#121212] border-gray-800 text-white h-96 flex items-center justify-center">
            <CardContent className="text-center">
              <BarChart className="h-16 w-16 text-[#EFCD00]/50 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Product Performance</h3>
              <p className="text-white opacity-70">
                Detailed product performance analytics will be implemented here.
                <br />
                This would include sales by product type, seasonal trends, and price optimization recommendations.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 