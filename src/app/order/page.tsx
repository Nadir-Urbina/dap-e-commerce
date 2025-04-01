"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ProductAvailability } from "@/components/product-availability"
import { ArrowLeft, ArrowRight, Calendar, CreditCard, MapPin, Minus, Plus, Truck } from "lucide-react"

export default function OrderPage() {
  const [step, setStep] = useState(1)
  const [orderItems, setOrderItems] = useState([
    {
      id: 1,
      name: "HMA SP-12.5",
      spec: "ODOT 448",
      price: 85.5,
      quantity: 2,
      status: "available",
      temperature: 315,
    },
    {
      id: 2,
      name: "HMA SP-9.5",
      spec: "ODOT 448",
      price: 82.75,
      quantity: 1,
      status: "available",
      temperature: 310,
    },
  ])

  const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFee = 150
  const total = subtotal + deliveryFee

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return

    setOrderItems(orderItems.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))
  }

  const removeItem = (id) => {
    setOrderItems(orderItems.filter((item) => item.id !== id))
  }

  const nextStep = () => {
    setStep(step + 1)
    window.scrollTo(0, 0)
  }

  const prevStep = () => {
    setStep(step - 1)
    window.scrollTo(0, 0)
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex items-center mb-8">
        <Link href="/products" className="flex items-center text-[#EFCD00] hover:text-[#EFCD00]/80">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Link>
        <h1 className="ml-auto text-2xl font-bold text-center text-[#EFCD00]">Your Order</h1>
        <div className="ml-auto"></div>
      </div>

      {/* Order Progress */}
      <div className="mb-8">
        <div className="flex justify-between max-w-3xl mx-auto">
          <div className={`flex flex-col items-center ${step >= 1 ? "text-[#F59E0B]" : "text-gray-400"}`}>
            <div
              className={`flex items-center justify-center w-10 h-10 mb-2 rounded-full ${step >= 1 ? "bg-[#F59E0B] text-black" : "bg-gray-700 text-gray-300"}`}
            >
              1
            </div>
            <span className="text-sm">Products</span>
          </div>
          <div className={`flex-1 h-1 mt-5 ${step >= 2 ? "bg-[#F59E0B]" : "bg-gray-700"}`}></div>
          <div className={`flex flex-col items-center ${step >= 2 ? "text-[#F59E0B]" : "text-gray-400"}`}>
            <div
              className={`flex items-center justify-center w-10 h-10 mb-2 rounded-full ${step >= 2 ? "bg-[#F59E0B] text-black" : "bg-gray-700 text-gray-300"}`}
            >
              2
            </div>
            <span className="text-sm">Delivery</span>
          </div>
          <div className={`flex-1 h-1 mt-5 ${step >= 3 ? "bg-[#F59E0B]" : "bg-gray-700"}`}></div>
          <div className={`flex flex-col items-center ${step >= 3 ? "text-[#F59E0B]" : "text-gray-400"}`}>
            <div
              className={`flex items-center justify-center w-10 h-10 mb-2 rounded-full ${step >= 3 ? "bg-[#F59E0B] text-black" : "bg-gray-700 text-gray-300"}`}
            >
              3
            </div>
            <span className="text-sm">Payment</span>
          </div>
          <div className={`flex-1 h-1 mt-5 ${step >= 4 ? "bg-[#F59E0B]" : "bg-gray-700"}`}></div>
          <div className={`flex flex-col items-center ${step >= 4 ? "text-[#F59E0B]" : "text-gray-400"}`}>
            <div
              className={`flex items-center justify-center w-10 h-10 mb-2 rounded-full ${step >= 4 ? "bg-[#F59E0B] text-black" : "bg-gray-700 text-gray-300"}`}
            >
              4
            </div>
            <span className="text-sm">Confirmation</span>
          </div>
        </div>
      </div>

      {/* Step 1: Product Selection */}
      {step === 1 && (
        <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
          <div>
            <Card className="bg-[#121212] text-white border-gray-800">
              <CardHeader>
                <CardTitle className="text-[#EFCD00]">Selected Products</CardTitle>
              </CardHeader>
              <CardContent>
                {orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col md:flex-row items-start md:items-center py-4 border-b border-gray-800 last:border-0"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#EFCD00]">{item.name}</h3>
                      <p className="text-sm text-gray-400">Spec: {item.spec}</p>
                      <div className="flex items-center mt-1 space-x-2">
                        <ProductAvailability status={item.status} />
                        {item.temperature > 0 && (
                          <Badge className="px-2 py-1 bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]">
                            {item.temperature}°F
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center mt-4 md:mt-0">
                      <div className="flex items-center mr-6">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-gray-700 text-white"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-gray-700 text-white"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <span className="ml-2 text-sm text-gray-400">tons</span>
                      </div>

                      <div className="text-right">
                        <div className="font-semibold">${(item.price * item.quantity).toFixed(2)}</div>
                        <div className="text-sm text-gray-400">${item.price.toFixed(2)}/ton</div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-900/20 mt-2 md:mt-0 md:ml-4"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}

                <div className="flex justify-center mt-6">
                  <Link href="/products">
                    <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                      Add More Products
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-4 bg-[#121212] text-white border-gray-800">
              <CardHeader>
                <CardTitle className="text-[#EFCD00]">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal ({totalQuantity} tons)</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2 bg-gray-700" />
                  <div className="flex justify-between font-semibold">
                    <span>Estimated Total</span>
                    <span className="text-[#EFCD00]">${total.toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Final amount will be based on actual tonnage delivered
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black"
                  onClick={nextStep}
                  disabled={orderItems.length === 0}
                >
                  Continue to Delivery
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}

      {/* Step 2: Delivery Details */}
      {step === 2 && (
        <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
          <div>
            <Card className="bg-[#121212] text-white border-gray-800">
              <CardHeader>
                <CardTitle className="text-[#EFCD00]">Delivery Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="delivery-location" className="text-white">
                    Delivery Location
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="delivery-location"
                      placeholder="Enter delivery address"
                      className="pl-9 bg-black border-gray-700 text-white"
                    />
                  </div>
                  <div className="h-64 mt-2 bg-black border border-gray-800 rounded-md flex items-center justify-center">
                    <p className="text-gray-400">Map Interface Would Appear Here</p>
                  </div>
                  <div className="flex items-center mt-2">
                    <input type="checkbox" id="save-location" className="mr-2" />
                    <label htmlFor="save-location" className="text-sm text-gray-300">
                      Save this location for future orders
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery-date" className="text-white">
                    Delivery Date & Time
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input id="delivery-date" type="date" className="pl-9 bg-black border-gray-700 text-white" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="delivery-time" className="text-white">
                        Preferred Time
                      </Label>
                      <select
                        id="delivery-time"
                        className="w-full p-2 border rounded-md bg-black border-gray-700 text-white"
                      >
                        <option value="">Select time slot</option>
                        <option value="morning">Morning (8AM - 12PM)</option>
                        <option value="afternoon">Afternoon (12PM - 4PM)</option>
                        <option value="evening">Evening (4PM - 7PM)</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="delivery-window" className="text-white">
                        Delivery Window
                      </Label>
                      <select
                        id="delivery-window"
                        className="w-full p-2 border rounded-md bg-black border-gray-700 text-white"
                      >
                        <option value="standard">Standard (4 hour window)</option>
                        <option value="precise">Precise (2 hour window)</option>
                        <option value="exact">Exact Time (±30 min)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="special-instructions" className="text-white">
                    Special Instructions
                  </Label>
                  <Textarea
                    id="special-instructions"
                    placeholder="Enter any special delivery instructions or site access information"
                    rows={4}
                    className="bg-black border-gray-700 text-white"
                  />
                </div>

                <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-md">
                  <h3 className="text-sm font-medium text-blue-400">Weather Alert</h3>
                  <p className="text-sm text-blue-300 mt-1">
                    Light rain is forecasted for your selected delivery date. Consider scheduling earlier in the day for
                    optimal conditions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-4 bg-[#121212] text-white border-gray-800">
              <CardHeader>
                <CardTitle className="text-[#EFCD00]">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal ({totalQuantity} tons)</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2 bg-gray-700" />
                  <div className="flex justify-between font-semibold">
                    <span>Estimated Total</span>
                    <span className="text-[#EFCD00]">${total.toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Final amount will be based on actual tonnage delivered
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h3 className="font-medium mb-2 text-white">Selected Products:</h3>
                  <ul className="text-sm space-y-1">
                    {orderItems.map((item) => (
                      <li key={item.id} className="flex justify-between">
                        <span>{item.name}</span>
                        <span>{item.quantity} tons</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black" onClick={nextStep}>
                  Continue to Payment
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-gray-700 text-white hover:bg-gray-800"
                  onClick={prevStep}
                >
                  Back to Products
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}

      {/* Step 3: Review & Payment */}
      {step === 3 && (
        <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
          <div>
            <Card className="mb-6 bg-[#121212] text-white border-gray-800">
              <CardHeader>
                <CardTitle className="text-[#EFCD00]">Review Your Order</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2 text-white">Products</h3>
                    <ul className="space-y-2">
                      {orderItems.map((item) => (
                        <li key={item.id} className="flex justify-between">
                          <div>
                            <span className="font-medium text-white">{item.name}</span>
                            <span className="text-sm text-gray-400 ml-2">({item.spec})</span>
                          </div>
                          <div className="text-right">
                            <span>{item.quantity} tons</span>
                            <span className="text-sm text-gray-400 ml-2">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div>
                    <h3 className="font-medium mb-2 text-white">Delivery Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Delivery Address</p>
                        <p className="text-white">123 Construction Site, Anytown, OH 12345</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Delivery Date & Time</p>
                        <p className="text-white">June 15, 2023, Morning (8AM - 12PM)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#121212] text-white border-gray-800">
              <CardHeader>
                <CardTitle className="text-[#EFCD00]">Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 mb-6 bg-amber-900/20 border border-amber-800 rounded-md">
                  <h3 className="text-sm font-medium text-amber-400">Payment Process</h3>
                  <p className="text-sm text-amber-300 mt-1">
                    We'll verify your card and place a temporary hold for the estimated amount. You'll only be charged
                    for the actual tonnage delivered after the order is complete.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="card-number" className="text-white">
                        Card Number
                      </Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="card-number"
                          placeholder="1234 5678 9012 3456"
                          className="pl-9 bg-black border-gray-700 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="expiry" className="text-white">
                        Expiry Date
                      </Label>
                      <Input id="expiry" placeholder="MM/YY" className="bg-black border-gray-700 text-white" />
                    </div>
                    <div>
                      <Label htmlFor="cvc" className="text-white">
                        CVC
                      </Label>
                      <Input id="cvc" placeholder="123" className="bg-black border-gray-700 text-white" />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="name-on-card" className="text-white">
                        Name on Card
                      </Label>
                      <Input
                        id="name-on-card"
                        placeholder="John Smith"
                        className="bg-black border-gray-700 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input type="checkbox" id="save-payment" className="mr-2" />
                    <label htmlFor="save-payment" className="text-sm text-gray-300">
                      Save this payment method for future orders
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input type="checkbox" id="terms" className="mr-2" />
                    <label htmlFor="terms" className="text-sm text-gray-300">
                      I agree to the{" "}
                      <Link href="#" className="text-[#F59E0B] hover:underline">
                        Terms and Conditions
                      </Link>{" "}
                      and{" "}
                      <Link href="#" className="text-[#F59E0B] hover:underline">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-4 bg-[#121212] text-white border-gray-800">
              <CardHeader>
                <CardTitle className="text-[#EFCD00]">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal ({totalQuantity} tons)</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2 bg-gray-700" />
                  <div className="flex justify-between font-semibold">
                    <span>Estimated Total</span>
                    <span className="text-[#EFCD00]">${total.toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Final amount will be based on actual tonnage delivered
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black" onClick={nextStep}>
                  Place Order
                  <Truck className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-gray-700 text-white hover:bg-gray-800"
                  onClick={prevStep}
                >
                  Back to Delivery
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 4 && (
        <div className="max-w-2xl mx-auto">
          <Card className="bg-[#121212] text-white border-gray-800">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-900/50 flex items-center justify-center">
                <Truck className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-[#EFCD00] mb-2">Order Confirmed!</h2>
              <p className="text-gray-300 mb-6">Your order has been received and is being processed.</p>

              <div className="p-4 mb-6 bg-[#1a1a1a] rounded-md text-left border border-gray-800">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Order Number:</span>
                  <span className="font-semibold text-white">#ASP-12345</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Estimated Delivery:</span>
                  <span className="text-white">June 15, 2023, Morning (8AM - 12PM)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment Status:</span>
                  <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-800">
                    Authorized
                  </Badge>
                </div>
              </div>

              <div className="space-y-4 text-left mb-6">
                <h3 className="font-semibold text-white">What happens next?</h3>
                <ol className="space-y-2 list-decimal list-inside text-gray-300">
                  <li>Our team will review your order and prepare your materials.</li>
                  <li>You'll receive a confirmation email with order details.</li>
                  <li>We'll contact you before delivery to confirm the exact time.</li>
                  <li>Your materials will be delivered to your specified location.</li>
                  <li>Final payment will be processed based on actual tonnage delivered.</li>
                </ol>
              </div>

              <div className="p-4 mb-6 bg-amber-900/20 border border-amber-800 rounded-md text-left">
                <h3 className="text-sm font-medium text-amber-400">Create an Account</h3>
                <p className="text-sm text-amber-300 mt-1 mb-3">
                  Save your information for faster checkout and track your orders easily.
                </p>
                <Button size="sm" className="bg-[#EFCD00] hover:bg-[#EFCD00]/90 text-black">
                  Create Account
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button variant="outline" className="flex-1 border-gray-700 text-white hover:bg-gray-800">
                  Track Order
                </Button>
                <Link href="/" className="flex-1">
                  <Button className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black">Return to Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

