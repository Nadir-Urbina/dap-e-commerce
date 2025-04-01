'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, getDoc, Timestamp, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, DailyMix, MixStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Trash, Edit, RefreshCw, ThermometerSun, MoreVertical, Calendar, Clock, Bell } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { useAuthContext } from '@/components/auth-provider';
import { cn, formatTimeAgo } from '@/lib/utils';

export default function DailyMixesPage() {
  const [mixes, setMixes] = useState<(DailyMix & { product?: Product })[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MixStatus | 'all'>('all');
  const [openDeleteDialog, setOpenDeleteDialog] = useState<string | null>(null);
  const [isAddMixOpen, setIsAddMixOpen] = useState(false);
  const [isUpdateStatusOpen, setIsUpdateStatusOpen] = useState<string | null>(null);
  const [updateTemperature, setUpdateTemperature] = useState<number>(0);
  
  // New state for tonnage updates
  const [isUpdateTonnageOpen, setIsUpdateTonnageOpen] = useState<string | null>(null);
  const [updateTonnage, setUpdateTonnage] = useState<number>(0);
  const [isFinalTonnage, setIsFinalTonnage] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthContext();

  // Form state for adding a new mix
  const [newMix, setNewMix] = useState({
    productId: '',
    temperature: 0,
    estimatedAvailableTime: new Date(),
    estimatedEndTime: new Date(new Date().setHours(new Date().getHours() + 8)),
    currentStatus: 'scheduled' as MixStatus,
    specialNotes: '',
    isProducing: false,
    estimatedTonnage: 0,
  });

  useEffect(() => {
    fetchMixesAndProducts();
  }, []);

  async function fetchMixesAndProducts() {
    try {
      setLoading(true);
      
      // Get today's date (start of day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = Timestamp.fromDate(today);
      
      // Fetch daily mixes
      const q = query(
        collection(db, 'dailyMixes'),
        where('date', '>=', todayTimestamp)
      );
      
      const querySnapshot = await getDocs(q);
      const mixesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DailyMix[];
      
      // Fetch products
      const productsQuerySnapshot = await getDocs(collection(db, 'products'));
      const productsData = productsQuerySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      // Set products state
      setProducts(productsData);
      
      // Join products with mixes
      const mixesWithProducts = mixesData.map(mix => {
        const product = productsData.find(product => product.id === mix.productId);
        return {
          ...mix,
          product
        };
      });
      
      setMixes(mixesWithProducts);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error loading data",
        description: "There was an error loading the mixes and products.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function deleteMix(mixId: string) {
    try {
      await deleteDoc(doc(db, 'dailyMixes', mixId));
      setMixes(mixes.filter(mix => mix.id !== mixId));
      setOpenDeleteDialog(null);
      toast({
        title: "Mix deleted",
        description: "The mix has been removed from today's schedule.",
      });
    } catch (error) {
      console.error('Error deleting mix:', error);
      toast({
        title: "Error deleting mix",
        description: "There was an error deleting the mix. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function updateMixStatus(mixId: string, newStatus: MixStatus, temperature?: number) {
    try {
      const mixRef = doc(db, 'dailyMixes', mixId);
      
      const updateData: any = {
        currentStatus: newStatus,
        updatedAt: serverTimestamp()
      };
      
      if (newStatus === 'producing') {
        updateData.isProducing = true;
      } else if (newStatus === 'complete' || newStatus === 'canceled') {
        updateData.isProducing = false;
      }
      
      if (temperature !== undefined) {
        updateData.temperature = temperature;
      }
      
      await updateDoc(mixRef, updateData);
      
      // Update local state
      setMixes(mixes.map(mix => {
        if (mix.id === mixId) {
          return {
            ...mix,
            currentStatus: newStatus,
            isProducing: newStatus === 'producing',
            temperature: temperature !== undefined ? temperature : mix.temperature,
            updatedAt: Timestamp.now()
          };
        }
        return mix;
      }));
      
      setIsUpdateStatusOpen(null);
      setUpdateTemperature(0);
      
      toast({
        title: "Mix status updated",
        description: `Mix status has been updated to ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating mix status:', error);
      toast({
        title: "Error updating status",
        description: "There was an error updating the mix status. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function updateMixTonnage(mixId: string) {
    try {
      if (updateTonnage < 0) {
        toast({
          title: "Invalid tonnage",
          description: "Tonnage cannot be negative.",
          variant: "destructive",
        });
        return;
      }

      const mixRef = doc(db, 'dailyMixes', mixId);
      
      const updateData: any = {
        updatedAt: serverTimestamp(),
        tonnageLastUpdated: serverTimestamp(),
        tonnageUpdatedBy: user?.uid,
      };
      
      // Update either currentTonnage or finalTonnage based on whether it's a final update
      if (isFinalTonnage) {
        updateData.finalTonnage = updateTonnage;
        updateData.currentStatus = 'complete';
        updateData.isProducing = false;
      } else {
        updateData.currentTonnage = updateTonnage;
      }
      
      await updateDoc(mixRef, updateData);
      
      // Update local state
      setMixes(mixes.map(mix => {
        if (mix.id === mixId) {
          return {
            ...mix,
            ...(isFinalTonnage ? 
              { finalTonnage: updateTonnage, currentStatus: 'complete', isProducing: false } : 
              { currentTonnage: updateTonnage }),
            tonnageLastUpdated: Timestamp.now(),
            tonnageUpdatedBy: user?.uid,
            updatedAt: Timestamp.now()
          };
        }
        return mix;
      }));
      
      setIsUpdateTonnageOpen(null);
      setUpdateTonnage(0);
      setIsFinalTonnage(false);
      
      toast({
        title: isFinalTonnage ? "Final tonnage recorded" : "Tonnage updated",
        description: isFinalTonnage ? 
          "The mix has been marked as complete with the final tonnage recorded." : 
          "The current production tonnage has been updated.",
      });
    } catch (error) {
      console.error('Error updating tonnage:', error);
      toast({
        title: "Error updating tonnage",
        description: "There was an error updating the tonnage. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleAddMix() {
    try {
      // Basic validation
      if (!newMix.productId) {
        toast({
          title: "Missing information",
          description: "Please select a product.",
          variant: "destructive",
        });
        return;
      }
      
      // Create new mix
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const mixData = {
        ...newMix,
        date: Timestamp.fromDate(today),
        estimatedAvailableTime: Timestamp.fromDate(new Date(newMix.estimatedAvailableTime)),
        estimatedEndTime: Timestamp.fromDate(new Date(newMix.estimatedEndTime)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        estimatedTonnage: newMix.estimatedTonnage || 0,
      };
      
      const docRef = await addDoc(collection(db, 'dailyMixes'), mixData);
      
      // Get product details
      const product = products.find(p => p.id === newMix.productId);
      
      // Update local state
      const newMixWithProduct = {
        id: docRef.id,
        ...mixData,
        product,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      setMixes([...mixes, newMixWithProduct]);
      
      // Reset form and close dialog
      setNewMix({
        productId: '',
        temperature: 0,
        estimatedAvailableTime: new Date(),
        estimatedEndTime: new Date(new Date().setHours(new Date().getHours() + 8)),
        currentStatus: 'scheduled',
        specialNotes: '',
        isProducing: false,
        estimatedTonnage: 0,
      });
      
      setIsAddMixOpen(false);
      
      toast({
        title: "Mix scheduled",
        description: "New mix has been added to today's production schedule.",
      });
    } catch (error) {
      console.error('Error adding mix:', error);
      toast({
        title: "Error scheduling mix",
        description: "There was an error adding the mix. Please try again.",
        variant: "destructive",
      });
    }
  }

  // Filter mixes based on active tab
  const filteredMixes = mixes.filter(mix => 
    activeTab === 'all' || mix.currentStatus === activeTab
  );

  // Format time from timestamp
  const formatTime = (timestamp: Timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      return 'N/A';
    }
  };

  const renderMixActions = (mix: DailyMix & { product?: Product }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#333333] text-white">
        <DropdownMenuItem onClick={() => setIsUpdateStatusOpen(mix.id)}>
          Update Status
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/dashboard/daily-mixes/edit/${mix.id}`)}>
          Edit Details
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="text-red-400"
          onClick={() => setOpenDeleteDialog(mix.id)}
        >
          Delete
        </DropdownMenuItem>
        {(mix.currentStatus === 'producing' || mix.currentStatus === 'available') && (
          <DropdownMenuItem 
            onSelect={() => {
              setIsUpdateTonnageOpen(mix.id);
              setUpdateTonnage(mix.currentTonnage || 0);
              setIsFinalTonnage(false);
            }}
            className="cursor-pointer"
          >
            Update Tonnage
          </DropdownMenuItem>
        )}
        {mix.currentStatus === 'available' && (
          <DropdownMenuItem 
            onSelect={() => {
              setIsUpdateTonnageOpen(mix.id);
              setUpdateTonnage(mix.finalTonnage || mix.currentTonnage || 0);
              setIsFinalTonnage(true);
            }}
            className="cursor-pointer"
          >
            Record Final Tonnage
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#EFCD00]">Daily Mixes</h1>
          <p className="text-gray-400">Manage today's asphalt mix production schedule</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            className="border-gray-700 text-white"
            onClick={fetchMixesAndProducts}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black"
            onClick={() => setIsAddMixOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule New Mix
          </Button>
        </div>
      </div>

      <Card className="bg-[#121212] border-gray-800 text-white">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Today's Production Schedule</CardTitle>
            <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | MixStatus)}>
              <TabsList className="bg-[#1a1a1a] border border-gray-800 p-0.5">
                <TabsTrigger value="all" className="px-4 py-2">All</TabsTrigger>
                <TabsTrigger value="scheduled" className="px-4 py-2">Scheduled</TabsTrigger>
                <TabsTrigger value="producing" className="px-4 py-2">Producing</TabsTrigger>
                <TabsTrigger value="complete" className="px-4 py-2">Completed</TabsTrigger>
                <TabsTrigger value="canceled" className="px-4 py-2">Canceled</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-6 text-center text-gray-400">Loading daily mixes...</div>
          ) : filteredMixes.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              No mixes found for the selected filter. 
              {activeTab === 'all' && (
                <span> Click "Schedule New Mix" to add a mix to today's production.</span>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-gray-800">
              <div className="grid grid-cols-7 p-4 font-medium border-b border-gray-800">
                <div>Product</div>
                <div>Status</div>
                <div>Temperature</div>
                <div>Estimated Start</div>
                <div>Estimated End</div>
                <div>Notes</div>
                <div className="text-right">Actions</div>
              </div>
              <div className="divide-y divide-gray-800">
                {filteredMixes.map((mix) => (
                  <div key={mix.id} className="grid grid-cols-7 p-4 items-center">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold text-white">{mix.product?.name || 'Unknown Product'}</h3>
                          <p className="text-sm text-gray-400">
                            {formatTime(mix.estimatedAvailableTime)} - {formatTime(mix.estimatedEndTime)}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            'uppercase px-3 py-1',
                            mix.currentStatus === 'scheduled' && 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/20',
                            mix.currentStatus === 'producing' && 'bg-green-600/20 text-green-300 hover:bg-green-600/20',
                            mix.currentStatus === 'available' && 'bg-orange-600/20 text-orange-300 hover:bg-orange-600/20',
                            mix.currentStatus === 'complete' && 'bg-gray-600/20 text-gray-300 hover:bg-gray-600/20',
                            mix.currentStatus === 'canceled' && 'bg-red-600/20 text-red-300 hover:bg-red-600/20',
                          )}
                        >
                          {mix.currentStatus}
                        </Badge>
                      </div>
                      
                      {/* Temperature Section */}
                      <div className="flex items-center space-x-2">
                        <ThermometerSun className="h-4 w-4 text-[#EFCD00]" />
                        <span className="text-white text-sm">{mix.temperature}°F</span>
                      </div>
                      
                      {/* Production Tonnage Section - Add this */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Production Tonnage</span>
                          <span className="text-white">
                            {mix.currentTonnage || 0} / {mix.estimatedTonnage || '?'} tons
                            {mix.finalTonnage ? ` (Final: ${mix.finalTonnage})` : ''}
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        {mix.estimatedTonnage > 0 && (
                          <div className="w-full bg-gray-800 rounded-full h-2.5">
                            <div 
                              className="bg-[#EFCD00] h-2.5 rounded-full" 
                              style={{ 
                                width: `${Math.min(
                                  ((mix.currentTonnage || 0) / mix.estimatedTonnage) * 100, 
                                  100
                                )}%` 
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Last Updated Info */}
                        {mix.tonnageLastUpdated && (
                          <p className="text-xs text-gray-500">
                            Updated {formatTimeAgo(mix.tonnageLastUpdated.toDate())}
                          </p>
                        )}
                      </div>
                      
                      {/* Notes Section */}
                      {mix.specialNotes && (
                        <div className="bg-[#191919] p-3 rounded-md">
                          <p className="text-sm text-gray-300">{mix.specialNotes}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end">
                      {renderMixActions(mix)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Mix Dialog */}
      <Dialog open={isAddMixOpen} onOpenChange={setIsAddMixOpen}>
        <DialogContent className="bg-[#121212] text-white">
          <DialogHeader>
            <DialogTitle>Schedule New Mix</DialogTitle>
            <DialogDescription className="text-gray-400">
              Schedule a new HMA product mix for today's production.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleAddMix(); }}>
            <div className="grid gap-4 py-4">
              {/* Product Selection */}
              <div className="grid gap-2">
                <Label htmlFor="product">Product</Label>
                <Select 
                  onValueChange={(value) => setNewMix({...newMix, productId: value})}
                  value={newMix.productId}
                >
                  <SelectTrigger className="bg-[#0f0f0f] border-gray-700">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f0f0f] border-gray-700 text-white">
                    {products
                      .filter(product => 
                        product.category === 'HMA' || 
                        product.category === 'Asphalt' || 
                        product.category === 'RAP'
                      )
                      .map(product => (
                        <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              {/* Temperature */}
              <div className="grid gap-2">
                <Label htmlFor="temperature">Temperature (°F)</Label>
                <Input 
                  id="temperature" 
                  type="number" 
                  min="0"
                  value={newMix.temperature}
                  onChange={(e) => setNewMix({...newMix, temperature: parseInt(e.target.value) || 0})}
                  className="bg-[#0f0f0f] border-gray-700"
                />
              </div>
              
              {/* Estimated Tonnage - new field */}
              <div className="grid gap-2">
                <Label htmlFor="estimatedTonnage">Estimated Tonnage (tons)</Label>
                <Input 
                  id="estimatedTonnage" 
                  type="number" 
                  min="0"
                  step="0.1"
                  value={newMix.estimatedTonnage}
                  onChange={(e) => setNewMix({...newMix, estimatedTonnage: parseFloat(e.target.value) || 0})}
                  className="bg-[#0f0f0f] border-gray-700"
                />
              </div>

              {/* Time Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={
                      newMix.estimatedAvailableTime instanceof Date
                        ? newMix.estimatedAvailableTime.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })
                        : ''
                    }
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':').map(Number);
                      const date = new Date();
                      date.setHours(hours, minutes, 0, 0);
                      setNewMix({ ...newMix, estimatedAvailableTime: date });
                    }}
                    className="bg-[#0f0f0f] border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={
                      newMix.estimatedEndTime instanceof Date
                        ? newMix.estimatedEndTime.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })
                        : ''
                    }
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':').map(Number);
                      const date = new Date();
                      date.setHours(hours, minutes, 0, 0);
                      setNewMix({ ...newMix, estimatedEndTime: date });
                    }}
                    className="bg-[#0f0f0f] border-gray-700 text-white"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="grid gap-2">
                <Label htmlFor="notes">Special Notes</Label>
                <Textarea 
                  id="notes"
                  value={newMix.specialNotes}
                  onChange={(e) => setNewMix({...newMix, specialNotes: e.target.value})}
                  className="bg-[#0f0f0f] border-gray-700 min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddMixOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Schedule Mix</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={!!isUpdateStatusOpen} onOpenChange={() => setIsUpdateStatusOpen(null)}>
        <DialogContent className="bg-[#121212] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Update Mix Status</DialogTitle>
            <DialogDescription className="text-gray-400">
              Change the status of this mix in the production schedule.
            </DialogDescription>
          </DialogHeader>
          
          {isUpdateStatusOpen && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={mixes.find(mix => mix.id === isUpdateStatusOpen)?.currentStatus || ''}
                  onValueChange={(value) => {
                    setMixes(mixes.map(mix => {
                      if (mix.id === isUpdateStatusOpen) {
                        return { ...mix, currentStatus: value as MixStatus };
                      }
                      return mix;
                    }));
                  }}
                >
                  <SelectTrigger className="bg-[#1a1a1a] border-gray-700 text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-700 text-white">
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="producing">Producing</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {mixes.find(mix => mix.id === isUpdateStatusOpen)?.currentStatus === 'producing' && (
                <div className="space-y-2">
                  <Label htmlFor="temperature">Current Temperature (°F)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    value={updateTemperature || mixes.find(mix => mix.id === isUpdateStatusOpen)?.temperature || 0}
                    onChange={(e) => setUpdateTemperature(Number(e.target.value))}
                    min={0}
                    placeholder="Temperature in °F"
                    className="bg-[#1a1a1a] border-gray-700 text-white"
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              className="border-gray-700 text-white"
              onClick={() => setIsUpdateStatusOpen(null)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-[#EFCD00] text-black hover:bg-[#EFCD00]/90"
              onClick={() => {
                if (isUpdateStatusOpen) {
                  const mix = mixes.find(mix => mix.id === isUpdateStatusOpen);
                  if (mix) {
                    updateMixStatus(
                      isUpdateStatusOpen,
                      mix.currentStatus,
                      updateTemperature || mix.temperature
                    );
                  }
                }
              }}
            >
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!openDeleteDialog} onOpenChange={() => setOpenDeleteDialog(null)}>
        <AlertDialogContent className="bg-[#121212] border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this mix?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will remove the mix from today's production schedule. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-700 text-white hover:bg-[#1a1a1a]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-900/50 text-red-400 border-red-800 hover:bg-red-900"
              onClick={() => openDeleteDialog && deleteMix(openDeleteDialog)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add the Update Tonnage Dialog */}
      <Dialog open={isUpdateTonnageOpen !== null} onOpenChange={(open) => !open && setIsUpdateTonnageOpen(null)}>
        <DialogContent className="bg-[#1a1a1a] text-white border-[#333333]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isFinalTonnage ? "Record Final Tonnage" : "Update Production Tonnage"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {isFinalTonnage 
                ? "Enter the final tonnage produced for this mix." 
                : "Enter the current tonnage produced for this mix."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tonnage">
                {isFinalTonnage ? "Final Tonnage" : "Current Tonnage"} (tons)
              </Label>
              <Input
                id="tonnage"
                type="number"
                min="0"
                step="0.1"
                value={updateTonnage || 0}
                onChange={(e) => setUpdateTonnage(parseFloat(e.target.value) || 0)}
                className="bg-[#0f0f0f] border-[#333333]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateTonnageOpen(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => updateMixTonnage(isUpdateTonnageOpen!)}
              className="bg-[#EFCD00] text-black hover:bg-[#EFCD00]/90"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 