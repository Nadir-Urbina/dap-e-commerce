"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Truck } from "lucide-react"

export function OrderTracker() {
  const [orderNumber, setOrderNumber] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would navigate to the order tracking page
    console.log("Tracking order:", orderNumber)
  }

  return (
    <div className="p-4 bg-[#121212] rounded-lg shadow-md text-white">
      <h3 className="mb-2 text-lg font-semibold text-[#EFCD00]">Track Your Order</h3>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Enter order number"
            className="pl-9 border-gray-700 bg-black text-white"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
          />
        </div>
        <Button type="submit" className="bg-[#EFCD00] hover:bg-[#EFCD00]/90 text-black">
          <Truck className="w-4 h-4 mr-2" />
          Track Order
        </Button>
      </form>
    </div>
  )
}

