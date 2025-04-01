'use client';

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  MoreVertical,
  Download,
  ArrowUpDown,
  Check,
  Clock,
  Truck,
  XCircle,
} from "lucide-react";
import { Order } from "@/lib/types";

interface OrdersTableProps {
  orders: Order[];
  isLoading?: boolean;
  showPagination?: boolean;
  limit?: number;
}

export function OrdersTable({
  orders,
  isLoading = false,
  showPagination = true,
  limit,
}: OrdersTableProps) {
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  const sortedOrders = [...orders].sort((a, b) => {
    if (sortBy === "date") {
      return sortDirection === "asc"
        ? a.createdAt.seconds - b.createdAt.seconds
        : b.createdAt.seconds - a.createdAt.seconds;
    } else if (sortBy === "customer") {
      return sortDirection === "asc"
        ? a.customerName.localeCompare(b.customerName)
        : b.customerName.localeCompare(a.customerName);
    } else if (sortBy === "total") {
      return sortDirection === "asc"
        ? a.total - b.total
        : b.total - a.total;
    }
    return 0;
  });

  const displayOrders = limit ? sortedOrders.slice(0, limit) : sortedOrders;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "confirmed":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Check className="mr-1 h-3 w-3" />
            Confirmed
          </Badge>
        );
      case "delivered":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            <Truck className="mr-1 h-3 w-3" />
            Delivered
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="mr-1 h-3 w-3" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Order ID</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("date")}>
                <div className="flex items-center gap-1">
                  Date
                  {sortBy === "date" && (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("customer")}>
                <div className="flex items-center gap-1">
                  Customer
                  {sortBy === "customer" && (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </div>
              </TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("total")}>
                <div className="flex items-center gap-1">
                  Total
                  {sortBy === "total" && (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  Loading orders...
                </TableCell>
              </TableRow>
            ) : displayOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              displayOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id.slice(0, 8)}</TableCell>
                  <TableCell>
                    {format(new Date(order.createdAt.seconds * 1000), "MMM d, yyyy")}
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(order.createdAt.seconds * 1000), "h:mm a")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{order.customerName}</div>
                    <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                  </TableCell>
                  <TableCell>
                    <div>{order.items.length} products</div>
                    <div className="text-xs text-muted-foreground">
                      {order.items[0]?.name}
                      {order.items.length > 1 ? ` + ${order.items.length - 1} more` : ""}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>${order.total.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/orders/${order.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" /> Download Invoice
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {showPagination && orders.length > 0 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            disabled
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
} 