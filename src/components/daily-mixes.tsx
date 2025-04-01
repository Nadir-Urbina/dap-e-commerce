'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductAvailability } from "@/components/product-availability";
import { ArrowRight, Clock } from "lucide-react";
import { useDailyMixes } from "@/hooks/useDailyMixes";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export function DailyMixes() {
  const { mixes, loading, error } = useDailyMixes();

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex flex-col space-y-2 mb-8">
          <Skeleton className="w-64 h-8" />
          <div className="flex items-center space-x-2">
            <Skeleton className="w-40 h-6" />
            <Skeleton className="w-40 h-6" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="overflow-hidden border-0 shadow-lg bg-[#121212] text-white h-full">
              <CardContent className="p-0">
                <div className="p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between">
                    <Skeleton className="w-32 h-6 bg-gray-700" />
                    <Skeleton className="w-24 h-6 bg-gray-700" />
                  </div>
                  <Skeleton className="w-full h-16 mt-4 bg-gray-700" />
                  <div className="flex items-center mt-4 space-x-2">
                    <Skeleton className="w-16 h-6 bg-gray-700" />
                    <Skeleton className="w-16 h-6 bg-gray-700" />
                  </div>
                  <div className="flex items-end justify-between mt-auto pt-6">
                    <div>
                      <Skeleton className="w-24 h-4 mb-2 bg-gray-700" />
                      <Skeleton className="w-20 h-8 bg-gray-700" />
                    </div>
                    <Skeleton className="w-24 h-10 bg-gray-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="p-6 text-center bg-red-900/20 border border-red-900 rounded-md">
          <p className="text-red-400">Failed to load today's mixes: {error.message}</p>
          <Button variant="outline" className="mt-4 border-red-500 text-red-400 hover:bg-red-900/20">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Calculate if any mix is currently producing
  const isProducing = mixes.some(mix => mix.isProducing);
  
  // Get the latest update time
  const latestUpdateTime = mixes.length > 0 
    ? new Date(Math.max(...mixes.map(mix => mix.updatedAt?.toDate?.() || 0)))
    : new Date();
  
  // Format time difference
  const minutesAgo = Math.floor((new Date().getTime() - latestUpdateTime.getTime()) / 60000);
  const updateText = minutesAgo <= 60 
    ? `${minutesAgo} minutes ago` 
    : `${Math.floor(minutesAgo / 60)} hours ago`;

  return (
    <div className="w-full">
      <div className="flex flex-col space-y-2 mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-[#EFCD00]">Today's Available Mixes</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-[#EFCD00] border-[#EFCD00]">
            <div className={`w-2 h-2 mr-1 rounded-full ${isProducing ? 'bg-green-500' : 'bg-red-500'}`}></div>
            Plant Status: {isProducing ? 'Producing' : 'Not Producing'}
          </Badge>
          <Badge variant="outline" className="text-[#EFCD00] border-[#EFCD00]">
            <Clock className="w-3 h-3 mr-1" />
            Updated {updateText}
          </Badge>
        </div>
      </div>

      {mixes.length === 0 ? (
        <div className="p-6 text-center bg-[#343434]/30 border border-[#343434] rounded-md">
          <p className="text-gray-300">No mixes are currently scheduled for today.</p>
          <p className="mt-2 text-gray-400">Please check back later or contact our office for special orders.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mixes.map((mix) => (
            <MixCard key={mix.id} mix={mix} />
          ))}
        </div>
      )}

      <div className="flex justify-center mt-8">
        <Button size="lg" className="bg-[#343434] hover:bg-[#343434]/90" asChild>
          <Link href="/products">
            View All Products
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function MixCard({ mix }) {
  // Format the time from Firestore timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = timestamp.toDate();
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      return 'N/A';
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-[#121212] text-white h-full">
      <CardContent className="p-0">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-[#EFCD00]">
                {mix.product?.name || 'Asphalt Mix'}
              </h3>
              {mix.product?.specs?.specNumber && (
                <p className="text-sm text-gray-400">Spec: {mix.product.specs.specNumber}</p>
              )}
            </div>
            <ProductAvailability status={mix.isProducing ? 'available' : mix.currentStatus} />
          </div>

          <p className="mt-3 text-gray-300">{mix.product?.description || mix.specialNotes}</p>

          <div className="flex items-center mt-4 space-x-2">
            {mix.temperature > 0 && (
              <Badge className="px-2 py-1 bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]">{mix.temperature}°F</Badge>
            )}
            {mix.currentStatus === 'producing' && (
              <Badge className="px-2 py-1 bg-green-900/50 text-green-400 border-green-800">Now Producing</Badge>
            )}
            {mix.currentStatus === 'scheduled' && (
              <Badge className="px-2 py-1 bg-blue-900/50 text-blue-400 border-blue-800">
                Available at {formatTime(mix.estimatedAvailableTime)}
              </Badge>
            )}
            {mix.product?.specs?.odotApproved && (
              <Badge className="px-2 py-1 bg-green-900 text-green-400 border-green-800">ODOT Approved</Badge>
            )}
          </div>

          <div className="flex items-end justify-between mt-auto pt-6">
            <div>
              <p className="text-sm text-gray-400">Price per ton</p>
              <p className="text-2xl font-bold text-white">${mix.product?.pricePerUnit?.toFixed(2) || '—'}</p>
            </div>
            <Button size="sm" className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black">
              Order Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 