"use client"

import { useState } from "react"
import { useProducts } from "@/hooks/useProducts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductAvailability } from "@/components/product-availability"
import { ArrowUpDown, Filter, ShoppingCart, Phone } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ProductType } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<ProductType | 'all'>('all')
  const [sortBy, setSortBy] = useState("featured")

  // Fetch products based on active tab
  const { products, loading, error } = useProducts({
    type: activeTab === 'all' ? undefined : activeTab,
    limit: 50,
  })

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex flex-col space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#EFCD00]">Products</h1>
        <p className="text-gray-400">Browse our selection of high-quality Hot Mix Asphalt (HMA) products</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="sticky top-4 p-4 bg-[#121212] rounded-lg border border-gray-800 shadow-sm text-white">
            <h2 className="text-lg font-semibold mb-4 text-[#EFCD00]">Filters</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2 text-[#EFCD00]">Categories</h3>
                <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as ProductType | 'all')} className="w-full">
                  <TabsList className="w-full bg-black">
                    <TabsTrigger
                      value="all"
                      className="flex-1 data-[state=active]:bg-[#EFCD00] data-[state=active]:text-black"
                    >
                      All Products
                    </TabsTrigger>
                    <TabsTrigger
                      value="asphalt_mix"
                      className="flex-1 data-[state=active]:bg-[#EFCD00] data-[state=active]:text-black"
                    >
                      Asphalt Mixes
                    </TabsTrigger>
                    <TabsTrigger
                      value="secondary"
                      className="flex-1 data-[state=active]:bg-[#EFCD00] data-[state=active]:text-black"
                    >
                      Secondary Products
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2 text-[#EFCD00]">Specifications</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="checkbox" id="odot-approved" className="mr-2" />
                    <label htmlFor="odot-approved" className="text-sm text-gray-300">
                      ODOT Approved
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="heavy-duty" className="mr-2" />
                    <label htmlFor="heavy-duty" className="text-sm text-gray-300">
                      Heavy Duty
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2 text-[#EFCD00]">Availability</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="checkbox" id="available-now" className="mr-2" />
                    <label htmlFor="available-now" className="text-sm text-gray-300">
                      Available Now
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="limited" className="mr-2" />
                    <label htmlFor="limited" className="text-sm text-gray-300">
                      Limited Quantity
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2 text-[#EFCD00]">Price Range</h3>
                <div className="flex items-center space-x-2">
                  <Input type="number" placeholder="Min" className="w-full bg-[#121212] border-gray-700 text-white" />
                  <span>-</span>
                  <Input type="number" placeholder="Max" className="w-full bg-[#121212] border-gray-700 text-white" />
                </div>
              </div>

              <Button className="w-full bg-[#343434] hover:bg-[#343434]/90">
                <Filter className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Product Listing */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center">
              <Badge variant="outline" className="text-[#EFCD00] border-[#EFCD00]">
                <div className="w-2 h-2 mr-1 rounded-full bg-green-500"></div>
                Plant Status: Producing
              </Badge>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto border-gray-700 text-white">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Sort by: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#121212] border-gray-700 text-white">
                <DropdownMenuItem onClick={() => setSortBy("featured")}>Featured</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("price-low")}>Price: Low to High</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("price-high")}>Price: High to Low</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("newest")}>Newest</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Tabs value={activeTab} defaultValue="all">
            {/* Hide duplicate tabs list */}
            <TabsList className="hidden">
              <TabsTrigger value="all">All Products</TabsTrigger>
              <TabsTrigger value="asphalt_mix">Asphalt Mixes</TabsTrigger>
              <TabsTrigger value="secondary">Secondary Products</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              <h2 className="mb-4 text-xl font-semibold">All Products</h2>
              {renderProductsList(products, loading, error)}
            </TabsContent>

            <TabsContent value="asphalt_mix" className="mt-0">
              <h2 className="mb-4 text-xl font-semibold">Asphalt Mixes</h2>
              {renderProductsList(products, loading, error)}
            </TabsContent>

            <TabsContent value="secondary" className="mt-0">
              <h2 className="mb-4 text-xl font-semibold">Secondary Products</h2>
              {renderProductsList(products, loading, error)}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function renderProductsList(products, loading, error) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="overflow-hidden border shadow">
            <CardContent className="p-0">
              <div className="p-6">
                <Skeleton className="w-2/3 h-6 mb-2" />
                <Skeleton className="w-1/3 h-4 mb-4" />
                <Skeleton className="w-full h-16 mb-4" />
                <div className="flex gap-2 mb-4">
                  <Skeleton className="w-20 h-6" />
                  <Skeleton className="w-20 h-6" />
                </div>
                <div className="flex items-end justify-between">
                  <Skeleton className="w-24 h-8" />
                  <Skeleton className="w-24 h-10" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Error loading products: {error.message}</p>
        <Button className="mt-4" variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No products available in this category.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

function ProductCard({ product }) {
  return (
    <Card className="overflow-hidden border shadow">
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold">{product.name}</h3>
              {product.specs?.specNumber && (
                <p className="text-sm text-gray-500">Spec: {product.specs.specNumber}</p>
              )}
            </div>
            <ProductAvailability status="available" />
          </div>

          <p className="mt-3 text-gray-700">{product.description}</p>

          <div className="flex flex-wrap items-center mt-4 gap-2">
            {product.specs?.odotApproved && (
              <Badge className="bg-green-100 text-green-800 border-green-300">ODOT Approved</Badge>
            )}
            <Badge className="bg-blue-100 text-blue-800 border-blue-300">{product.unit}</Badge>
            {product.specs?.maxAggregateSize && (
              <Badge className="bg-purple-100 text-purple-800 border-purple-300">{product.specs.maxAggregateSize}mm</Badge>
            )}
            {product.tags?.map((tag) => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>

          <div className="flex items-end justify-between mt-6">
            <div>
              <p className="text-sm text-gray-500">Price per {product.unit}</p>
              <p className="text-2xl font-bold">${product.pricePerUnit?.toFixed(2)}</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" asChild>
                <Link href={`/products/${product.id}`}>Details</Link>
              </Button>
              <Button>
                Order Now
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

