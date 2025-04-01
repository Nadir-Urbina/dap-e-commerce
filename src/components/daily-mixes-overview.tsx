'use client';

import Link from "next/link";
import { format } from "date-fns";
import { useDailyMixes } from "@/hooks/useDailyMixes";
import { useProducts } from "@/hooks/useProducts";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layers, ArrowUpRight, Clock, CheckCircle, AlertCircle } from "lucide-react";

export function DailyMixesOverview() {
  const { dailyMixes = [], isLoading: mixesLoading } = useDailyMixes();
  const { products = [], isLoading: productsLoading } = useProducts();

  // Only show today's and future mixes, sorted by date
  const upcomingMixes = dailyMixes && dailyMixes.length
    ? dailyMixes
        .filter((mix) => {
          const mixDate = new Date(mix.date.seconds * 1000);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return mixDate >= today;
        })
        .sort((a, b) => a.date.seconds - b.date.seconds)
        .slice(0, 5)
    : [];

  const getProductName = (productId: string) => {
    const product = products && products.find((p) => p.id === productId);
    return product?.name || "Unknown Product";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Clock className="mr-1 h-3 w-3" />
            Scheduled
          </Badge>
        );
      case "producing":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <AlertCircle className="mr-1 h-3 w-3" />
            Producing
          </Badge>
        );
      case "available":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle className="mr-1 h-3 w-3" />
            Available
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl font-bold">Daily Mixes Schedule</CardTitle>
          <CardDescription>
            Today's available asphalt mixes and upcoming production
          </CardDescription>
        </div>
        <Layers className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {mixesLoading || productsLoading ? (
          <div className="flex h-[280px] items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading daily mixes...</p>
          </div>
        ) : upcomingMixes.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No upcoming mixes scheduled</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/dashboard/daily-mixes">Schedule Production</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingMixes.map((mix) => (
              <div key={mix.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="grid gap-1">
                  <h3 className="font-semibold">{getProductName(mix.productId)}</h3>
                  <time dateTime={new Date(mix.date.seconds * 1000).toISOString()} className="text-sm text-muted-foreground">
                    {format(new Date(mix.date.seconds * 1000), "EEEE, MMMM d")}
                  </time>
                  <div className="mt-1">
                    {getStatusBadge(mix.status)}
                  </div>
                </div>
                {mix.status === "available" && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/products/${mix.productId}`}>Order Now</Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/dashboard/daily-mixes" className="flex items-center justify-center gap-2">
            <span>View Full Production Schedule</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 