'use client';

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OrdersTable } from "@/components/orders-table";
import { Search, RefreshCw, FilterX, Filter } from "lucide-react";
import { Order } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrders } from "@/hooks/useOrders";

export default function OrdersPage() {
  const { orders, isLoading, refetch } = useOrders();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            View and manage customer orders
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refetch}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders by customer or ID..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          {(searchQuery || statusFilter !== "all") && (
            <Button variant="ghost" onClick={resetFilters}>
              <FilterX className="h-4 w-4" />
              <span className="sr-only">Reset filters</span>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <OrdersTable
            orders={filteredOrders}
            isLoading={isLoading}
            showPagination={true}
          />
        </CardContent>
      </Card>
    </div>
  );
} 