'use client';

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Clock, Download, Home, LineChart, Package, Package2, Search, ShoppingCart, Truck, AlertTriangle, ListFilter, Layers, TrendingUp, CircleDollarSign, ArrowUpRight, AlertCircle, DollarSign } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore"
import { Order, DailyMix } from "@/lib/types"
import { useDailyMixes } from "@/hooks/useDailyMixes"
import { useProducts } from "@/hooks/useProducts"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("active")
  const [orderStats, setOrderStats] = useState({
    today: 0,
    pending: 0,
    completed: 0,
    inProgress: 0,
  })
  const [mixStats, setMixStats] = useState({
    producing: 0,
    scheduled: 0,
    total: 0,
  })
  const [loading, setLoading] = useState(true)
  const { dailyMixes = [], isLoading: mixesLoading } = useDailyMixes()
  const { products = [], isLoading: productsLoading } = useProducts()

  const availableMixes = dailyMixes.filter(mix => mix.status === "available").length
  const totalProducts = products.length

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        setLoading(true)
        
        // Get today's date (start of day)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayTimestamp = Timestamp.fromDate(today)
        
        // Fetch order stats
        const ordersCollection = collection(db, "orders")
        
        // Today's orders
        const todayOrdersQuery = query(
          ordersCollection,
          where("createdAt", ">=", todayTimestamp),
          orderBy("createdAt", "desc")
        )
        const todayOrdersSnapshot = await getDocs(todayOrdersQuery)
        
        // Pending orders
        const pendingOrdersQuery = query(
          ordersCollection,
          where("status", "in", ["pending", "confirmed"])
        )
        const pendingOrdersSnapshot = await getDocs(pendingOrdersQuery)
        
        // In progress orders
        const inProgressOrdersQuery = query(
          ordersCollection,
          where("status", "in", ["in_production", "loaded", "in_transit"])
        )
        const inProgressOrdersSnapshot = await getDocs(inProgressOrdersQuery)
        
        // Completed orders
        const completedOrdersQuery = query(
          ordersCollection,
          where("status", "in", ["delivered", "completed"])
        )
        const completedOrdersSnapshot = await getDocs(completedOrdersQuery)
        
        // Fetch mix stats
        const mixesCollection = collection(db, "dailyMixes")
        
        // Today's mixes
        const mixesQuery = query(
          mixesCollection,
          where("date", ">=", todayTimestamp)
        )
        const mixesSnapshot = await getDocs(mixesQuery)
        
        // Calculate stats
        const producingMixes = mixesSnapshot.docs.filter(doc => doc.data().isProducing).length
        const scheduledMixes = mixesSnapshot.docs.filter(doc => 
          doc.data().currentStatus === "scheduled"
        ).length
        
        // Update states
        setOrderStats({
          today: todayOrdersSnapshot.size,
          pending: pendingOrdersSnapshot.size,
          inProgress: inProgressOrdersSnapshot.size,
          completed: completedOrdersSnapshot.size,
        })
        
        setMixStats({
          producing: producingMixes,
          scheduled: scheduledMixes,
          total: mixesSnapshot.size,
        })
        
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchDashboardStats()
  }, [])

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-white opacity-70">
            Overview of your asphalt plant management system
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10 hover:text-white">
            Export Reports
          </Button>
          <Button size="sm" className="bg-[#EFCD00] hover:bg-[#EFCD00]/90 text-black">
            Quick Actions
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available Mixes</CardTitle>
            <Layers className="h-4 w-4 text-white opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mixesLoading ? "..." : availableMixes}</div>
            <p className="text-xs text-white opacity-70">
              {availableMixes > 0 ? "+5% from yesterday" : "No mixes available"}
            </p>
          </CardContent>
          <CardFooter className="p-2">
            <Link 
              href="/dashboard/daily-mixes"
              className="w-full"
            >
              <Button size="sm" variant="ghost" className="w-full justify-between text-white hover:text-white hover:bg-white/10">
                <span>View Details</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-white opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productsLoading ? "..." : totalProducts}</div>
            <p className="text-xs text-white opacity-70">
              {totalProducts} different asphalt mixes
            </p>
          </CardContent>
          <CardFooter className="p-2">
            <Link 
              href="/dashboard/products"
              className="w-full"
            >
              <Button size="sm" variant="ghost" className="w-full justify-between text-white hover:text-white hover:bg-white/10">
                <span>Manage Products</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <Truck className="h-4 w-4 text-white opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-white opacity-70">
              2 pending, 10 completed
            </p>
          </CardContent>
          <CardFooter className="p-2">
            <Link 
              href="/dashboard/orders"
              className="w-full"
            >
              <Button size="sm" variant="ghost" className="w-full justify-between text-white hover:text-white hover:bg-white/10">
                <span>View Orders</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-white opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$24,500</div>
            <div className="flex items-center gap-1 text-xs text-green-500">
              <TrendingUp className="h-3 w-3" />
              <span>+18% from last week</span>
            </div>
          </CardContent>
          <CardFooter className="p-2">
            <Link 
              href="/dashboard/reports"
              className="w-full"
            >
              <Button size="sm" variant="ghost" className="w-full justify-between text-white hover:text-white hover:bg-white/10">
                <span>Financial Reports</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Production Schedule</CardTitle>
            <CardDescription className="text-white opacity-70">Upcoming production for the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full rounded-md border border-white/20 p-4">
              <div className="flex h-full w-full items-center justify-center">
                <p className="text-sm text-white opacity-70">Production schedule visualization will appear here</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/schedule">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white">View Full Schedule</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
            <CardDescription className="text-white opacity-70">Recent notifications and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-start gap-4 rounded-lg border border-white/20 p-3 bg-black/40">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-white">Low inventory alert</p>
                    <p className="text-xs text-white opacity-70">S-III mix is running low on aggregate</p>
                    <p className="text-xs text-white opacity-50">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/alerts">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white">View All Alerts</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

