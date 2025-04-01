'use client';

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, Truck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full h-[500px] md:h-[600px] bg-black">
        <Image
          src="/hero-image.jpg"
          alt="Asphalt production plant with black silos and palm trees"
          fill
          className="object-cover opacity-90"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
        
        {/* Header Navigation */}
        <div className="absolute top-0 left-0 right-0 z-20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="text-xl font-bold text-[#EFCD00]">Duval Asphalt</div>
              <div className="flex items-center space-x-6">
                <Link href="/products" className="text-white hover:text-[#EFCD00]">Products</Link>
                <Link href="/about" className="text-white hover:text-[#EFCD00]">About</Link>
                <Link href="/contact" className="text-white hover:text-[#EFCD00]">Contact</Link>
                <div className="flex items-center space-x-2 ml-4">
                  <Button variant="outline" size="sm" className="border-[#EFCD00] text-[#EFCD00] hover:bg-[#EFCD00]/10" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="container relative z-10 flex flex-col items-start justify-center h-full px-4 mx-auto space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-[#EFCD00] sm:text-5xl md:text-6xl">
            Quality Asphalt, <br />
            On Demand
          </h1>
          <p className="max-w-lg text-lg text-gray-200">
            Professional-grade Hot Mix Asphalt (HMA) for construction projects of any size, delivered when you need it.
          </p>
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
            <Button size="lg" className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black" asChild>
              <Link href="/order">
                Order Today's Mixes
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-[#EFCD00] border-[#EFCD00] hover:bg-[#EFCD00]/10" asChild>
              <Link href="/products">
                Browse Products
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Access Order Tracking */}
      <section className="w-full py-6 bg-[#EFCD00]">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between max-w-4xl mx-auto rounded-lg p-6 bg-black bg-opacity-10">
            <div>
              <h2 className="text-xl font-bold text-black">Track Your Order</h2>
              <p className="text-sm text-black/80">Enter your order number to check status and ETA</p>
            </div>
            <div className="flex mt-4 md:mt-0 w-full md:w-auto">
              <Input 
                type="text"
                placeholder="Enter order number"
                className="rounded-r-none bg-white/80 border-none focus-visible:ring-offset-0 text-black"
              />
              <Button className="rounded-l-none bg-black text-white hover:bg-black/80">
                Track Order
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Available Mixes */}
      <section className="w-full py-12 bg-black text-white">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-[#EFCD00]">Today's Available Mixes</h2>
              <div className="flex items-center mt-2">
                <Badge className="bg-green-600 text-white mr-3">
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-white mr-1.5 animate-pulse"></span>
                    Plant Status: Producing
                  </span>
                </Badge>
                <p className="text-sm text-gray-400">Updated 10 minutes ago</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* HMA SP-12.5 */}
            <Card className="bg-[#121212] border-gray-800 text-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">HMA SP-12.5</h3>
                  <Badge className="bg-green-900/50 text-green-400 border-green-800">Available Now</Badge>
                </div>
                <p className="text-sm text-gray-400 mb-2">Spec: ODOT 448</p>
                <p className="text-sm mb-4">
                  Coarse-graded surface mix with 12.5mm nominal maximum aggregate size. Ideal for highways and high-traffic roads.
                </p>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex space-x-2">
                    <Badge variant="outline" className="bg-opacity-20 border-gray-700">SP-I</Badge>
                    <Badge variant="outline" className="bg-opacity-20 border-gray-700">Heavy Duty</Badge>
                    <Badge variant="outline" className="bg-opacity-20 border-gray-700 text-green-400">ODOT Approved</Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400">Price per ton</p>
                    <p className="text-2xl font-bold">$85.50</p>
                  </div>
                  <Button className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black">Order Now</Button>
                </div>
              </CardContent>
            </Card>

            {/* HMA SP-9.5 */}
            <Card className="bg-[#121212] border-gray-800 text-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">HMA SP-9.5</h3>
                  <Badge className="bg-green-900/50 text-green-400 border-green-800">Available Now</Badge>
                </div>
                <p className="text-sm text-gray-400 mb-2">Spec: ODOT 448</p>
                <p className="text-sm mb-4">
                  Fine-graded surface mix with 9.5mm nominal maximum aggregate size. Perfect for urban streets and residential paving.
                </p>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex space-x-2">
                    <Badge variant="outline" className="bg-opacity-20 border-gray-700">SP-I</Badge>
                    <Badge variant="outline" className="bg-opacity-20 border-gray-700">Heavy Duty</Badge>
                    <Badge variant="outline" className="bg-opacity-20 border-gray-700 text-green-400">ODOT Approved</Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400">Price per ton</p>
                    <p className="text-2xl font-bold">$82.75</p>
                  </div>
                  <Button className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black">Order Now</Button>
                </div>
              </CardContent>
            </Card>

            {/* Polymer Mixes */}
            <Card className="bg-[#121212] border-gray-800 text-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Polymer Mixes</h3>
                  <Badge className="bg-blue-900/50 text-blue-400 border-blue-800">Special Order</Badge>
                </div>
                <p className="text-sm mb-4">
                  Specialized polymer-modified asphalt mixes for enhanced durability and performance in extreme conditions.
                </p>
                <div className="flex items-center space-x-2 mb-6">
                  <Truck className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-400">
                    Please contact our office to place an order for polymer mixes.
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400">Price</p>
                    <p className="text-lg font-bold">Contact for pricing</p>
                  </div>
                  <Button variant="outline" className="border-[#F59E0B] text-[#F59E0B]">Contact Us</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center mt-8">
            <Button variant="outline" className="border-gray-700 text-white">
              View All Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full py-16 bg-gray-100">
        <div className="container px-4 mx-auto">
          <h2 className="mb-10 text-3xl font-bold tracking-tight text-center text-[#343434]">
            Trusted by Construction Companies
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Testimonial 1 */}
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <div className="flex mb-4">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current text-[#F59E0B]" />
                ))}
              </div>
              <p className="mb-4 text-gray-700">
                "The quality of their HMA SP-12.5 is consistently excellent. Their online ordering system has saved us countless hours."
              </p>
              <div className="pt-4 mt-4 border-t border-gray-100">
                <p className="font-bold text-[#343434]">Michael Johnson</p>
                <p className="text-sm text-gray-500">Johnson Construction</p>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <div className="flex mb-4">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current text-[#F59E0B]" />
                ))}
              </div>
              <p className="mb-4 text-gray-700">
                "Being able to track our orders in real-time has been a game-changer for our project planning."
              </p>
              <div className="pt-4 mt-4 border-t border-gray-100">
                <p className="font-bold text-[#343434]">Sarah Williams</p>
                <p className="text-sm text-gray-500">Williams Paving</p>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <div className="flex mb-4">
                {[1, 2, 3, 4].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current text-[#F59E0B]" />
                ))}
                <Star className="w-4 h-4 fill-current text-gray-300" />
              </div>
              <p className="mb-4 text-gray-700">
                "Their ODOT approved mixes have been perfect for our highway projects. The delivery is always on time."
              </p>
              <div className="pt-4 mt-4 border-t border-gray-100">
                <p className="font-bold text-[#343434]">Robert Davis</p>
                <p className="text-sm text-gray-500">Davis Highway Construction</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 bg-[#121212] text-white">
        <div className="container px-4 mx-auto text-center">
          <h2 className="mb-4 text-3xl font-bold text-[#EFCD00]">Ready to Place Your Order?</h2>
          <p className="max-w-2xl mx-auto mb-8 text-gray-300">
            Our plant is currently producing all standard HMA mixes with same-day delivery available.
          </p>
          <Button size="lg" className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black" asChild>
            <Link href="/order">
              Start Your Order
              <Truck className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 bg-black text-white">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <div className="flex items-center">
              <span className="text-xl font-bold text-[#EFCD00]">Duval Asphalt</span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/about" className="text-gray-400 hover:text-white">About</Link>
              <Link href="/products" className="text-gray-400 hover:text-white">Products</Link>
              <Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link>
              <Link href="/login" className="text-gray-400 hover:text-white">Login</Link>
              <Link href="/register" className="text-gray-400 hover:text-white">Request Account</Link>
            </div>
            <div className="text-sm text-gray-400">
              © {new Date().getFullYear()} Duval Asphalt. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

