'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, updateDoc, addDoc, query, orderBy, where, Timestamp, serverTimestamp } from 'firebase/firestore';
import { useAuthContext } from '@/components/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, AlertCircle, Calendar, Activity, ClipboardList, Plus, History } from 'lucide-react';
import { format } from 'date-fns';

// Define plant interface (using location data)
interface Plant {
  id: string;
  name: string;
  address?: string;
  status?: 'running' | 'down' | 'maintenance';
  lastUpdated?: Timestamp;
  updatedBy?: string;
  notes?: string;
}

// Define maintenance record interface
interface MaintenanceRecord {
  id: string;
  plantId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  reason: string;
  notes?: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Define status change record interface
interface StatusChange {
  id: string;
  plantId: string;
  timestamp: Timestamp;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  notes?: string;
}

export default function PlantsPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [statusChanges, setStatusChanges] = useState<StatusChange[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('status');
  const [maintenanceDialog, setMaintenanceDialog] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [maintenanceForm, setMaintenanceForm] = useState({
    reason: '',
    notes: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: format(new Date(), 'HH:mm'),
    endDate: '',
    endTime: ''
  });
  
  const router = useRouter();
  const { user, userData } = useAuthContext();
  
  // Compute these for use in the component
  const isAdmin = (userData as any)?.role === 'admin';
  const isStaff = (userData as any)?.role === 'staff';
  // Get the user's location permissions
  const userLocationId = (userData as any)?.locationId;
  const hasAllLocationsAccess = userLocationId === 'all' || isAdmin;
  
  // Redirect if user is not admin or staff
  useEffect(() => {
    // Using type assertion to bypass type checking
    const userRole = (userData as any)?.role;
    if (userData && userRole !== 'admin' && userRole !== 'staff') {
      router.push('/dashboard');
      return;
    }
    
    if (user) {
      fetchPlants();
    }
  }, [user, userData, router]);
  
  // Fetch plants data (from locations collection) and filter based on user permissions
  const fetchPlants = async () => {
    try {
      setIsLoading(true);
      
      // Fetch locations instead of plants
      const locationsRef = collection(db, 'locations');
      const locationsSnapshot = await getDocs(locationsRef);
      
      if (!locationsSnapshot.empty) {
        const plantsData = locationsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            address: data.address,
            // Add default status if not present
            status: data.status || 'running',
            lastUpdated: data.lastUpdated || serverTimestamp(),
            updatedBy: data.updatedBy || user?.uid,
            notes: data.notes
          } as Plant;
        });
        
        // Filter plants based on user permissions
        let filteredPlantsData: Plant[] = [];
        if (hasAllLocationsAccess) {
          // Admin or users with 'all' locations access see all plants
          filteredPlantsData = plantsData;
        } else if (userLocationId) {
          // Users with specific location access only see that location
          filteredPlantsData = plantsData.filter(plant => plant.id === userLocationId);
        } else {
          // Users with no location access don't see any plants
          filteredPlantsData = [];
        }
        
        setPlants(filteredPlantsData);
        
        if (filteredPlantsData.length === 0 && userLocationId && userLocationId !== 'all') {
          toast({
            title: 'No Locations Found',
            description: 'You do not have access to any locations or the assigned location does not exist.',
            variant: 'destructive',
          });
        }
      } else {
        setPlants([]);
        toast({
          title: 'No Locations Found',
          description: 'Please add locations in the Locations page before managing plants.',
        });
      }
      
      // Fetch status changes and maintenance records if needed
      try {
        // Fetch recent status changes - filter by user's accessible plants
        const statusChangesRef = collection(db, 'statusChanges');
        const statusQuery = query(
          statusChangesRef,
          orderBy('timestamp', 'desc')
        );
        
        const statusSnapshot = await getDocs(statusQuery);
        let statusData = statusSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as StatusChange[];
        
        // Filter status changes for user's plants if they don't have all access
        if (!hasAllLocationsAccess && userLocationId) {
          statusData = statusData.filter(change => change.plantId === userLocationId);
        }
        
        setStatusChanges(statusData);
      } catch (error) {
        console.log('Status changes collection may not exist yet:', error);
        setStatusChanges([]);
      }
      
      try {
        // Fetch maintenance records - filter by user's accessible plants
        const maintenanceRef = collection(db, 'maintenance');
        const maintenanceQuery = query(
          maintenanceRef,
          orderBy('startTime', 'desc')
        );
        
        const maintenanceSnapshot = await getDocs(maintenanceQuery);
        let maintenanceData = maintenanceSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MaintenanceRecord[];
        
        // Filter maintenance records for user's plants if they don't have all access
        if (!hasAllLocationsAccess && userLocationId) {
          maintenanceData = maintenanceData.filter(record => record.plantId === userLocationId);
        }
        
        setMaintenanceRecords(maintenanceData);
      } catch (error) {
        console.log('Maintenance collection may not exist yet:', error);
        setMaintenanceRecords([]);
      }
      
    } catch (error) {
      console.error('Error fetching plants data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load plants data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle plant status
  const togglePlantStatus = async (plant: Plant, newStatus: 'running' | 'down') => {
    try {
      if (!user || !plant.id) return;
      
      // Check if user has permission to modify this plant
      if (!hasAllLocationsAccess && userLocationId !== plant.id) {
        toast({
          title: 'Permission Denied',
          description: 'You do not have permission to modify this plant.',
          variant: 'destructive',
        });
        return;
      }
      
      const oldStatus = plant.status || 'running';
      
      // Update location status
      const locationRef = doc(db, 'locations', plant.id);
      await updateDoc(locationRef, {
        status: newStatus,
        lastUpdated: serverTimestamp(),
        updatedBy: user.uid
      });
      
      // Record status change
      const statusChangeRef = collection(db, 'statusChanges');
      await addDoc(statusChangeRef, {
        plantId: plant.id,
        timestamp: serverTimestamp(),
        oldStatus,
        newStatus,
        changedBy: user.uid,
        notes: `Status changed from ${oldStatus} to ${newStatus}`
      });
      
      // Update local state
      setPlants(plants.map(p => 
        p.id === plant.id 
          ? { ...p, status: newStatus, lastUpdated: Timestamp.now(), updatedBy: user.uid } 
          : p
      ));
      
      toast({
        title: 'Status Updated',
        description: `${plant.name} is now ${newStatus === 'running' ? 'running' : 'down'}.`,
      });
      
      // Refresh data
      fetchPlants();
    } catch (error) {
      console.error('Error updating plant status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update plant status.',
        variant: 'destructive',
      });
    }
  };
  
  // Schedule maintenance
  const scheduleMaintenance = async () => {
    try {
      if (!user || !selectedPlant) return;
      
      // Check if user has permission to modify this plant
      if (!hasAllLocationsAccess && userLocationId !== selectedPlant.id) {
        toast({
          title: 'Permission Denied',
          description: 'You do not have permission to schedule maintenance for this plant.',
          variant: 'destructive',
        });
        return;
      }
      
      // Parse dates and times
      const startDateTime = new Date(`${maintenanceForm.startDate}T${maintenanceForm.startTime}`);
      let endDateTime = null;
      
      if (maintenanceForm.endDate && maintenanceForm.endTime) {
        endDateTime = new Date(`${maintenanceForm.endDate}T${maintenanceForm.endTime}`);
      }
      
      // Validate form
      if (!maintenanceForm.reason) {
        toast({
          title: 'Validation Error',
          description: 'Please provide a reason for maintenance.',
          variant: 'destructive',
        });
        return;
      }
      
      // Create maintenance record
      const maintenanceRef = collection(db, 'maintenance');
      await addDoc(maintenanceRef, {
        plantId: selectedPlant.id,
        startTime: Timestamp.fromDate(startDateTime),
        endTime: endDateTime ? Timestamp.fromDate(endDateTime) : null,
        reason: maintenanceForm.reason,
        notes: maintenanceForm.notes,
        status: startDateTime <= new Date() ? 'in-progress' : 'scheduled',
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // If maintenance is starting now, update plant status
      if (startDateTime <= new Date()) {
        const locationRef = doc(db, 'locations', selectedPlant.id);
        await updateDoc(locationRef, {
          status: 'maintenance',
          lastUpdated: serverTimestamp(),
          updatedBy: user.uid,
          notes: maintenanceForm.reason
        });
        
        // Record status change
        const statusChangeRef = collection(db, 'statusChanges');
        await addDoc(statusChangeRef, {
          plantId: selectedPlant.id,
          timestamp: serverTimestamp(),
          oldStatus: selectedPlant.status || 'running',
          newStatus: 'maintenance',
          changedBy: user.uid,
          notes: `Maintenance started: ${maintenanceForm.reason}`
        });
      }
      
      // Close dialog and reset form
      setMaintenanceDialog(false);
      setMaintenanceForm({
        reason: '',
        notes: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        startTime: format(new Date(), 'HH:mm'),
        endDate: '',
        endTime: ''
      });
      
      toast({
        title: 'Maintenance Scheduled',
        description: `Maintenance for ${selectedPlant.name} has been scheduled.`,
      });
      
      // Refresh data
      fetchPlants();
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule maintenance.',
        variant: 'destructive',
      });
    }
  };
  
  // Format timestamp for display
  const formatTimestamp = (timestamp: Timestamp | any) => {
    if (!timestamp) return 'N/A';
    
    try {
      // Handle Firestore Timestamp objects
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return format(timestamp.toDate(), 'MMM d, yyyy h:mm a');
      }
      
      // Handle JavaScript Date objects
      if (timestamp instanceof Date) {
        return format(timestamp, 'MMM d, yyyy h:mm a');
      }
      
      // Handle timestamps stored as seconds or milliseconds
      if (typeof timestamp === 'number') {
        // Assume milliseconds if it's a large number (greater than 1 billion)
        const date = timestamp > 1000000000000 
          ? new Date(timestamp) 
          : new Date(timestamp * 1000);
        return format(date, 'MMM d, yyyy h:mm a');
      }
      
      // Handle string dates
      if (typeof timestamp === 'string') {
        return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
      }
      
      // Fallback
      return 'Invalid date';
    } catch (error) {
      console.error('Error formatting timestamp:', error, timestamp);
      return 'Invalid date';
    }
  };
  
  // Get user name from user ID
  const getUserName = (userId: string) => {
    if (userId === user?.uid) {
      // Use type assertion to bypass property access errors
      const userDataAny = userData as any;
      return `${userDataAny?.firstName || ''} ${userDataAny?.lastName || ''}` || 'Current User';
    }
    return userId; // Fallback to user ID if we can't resolve the name
  };
  
  // Find plant name by ID with permission checking
  const getPlantName = (plantId: string) => {
    // For status/maintenance history, we still show the plant name even if user doesn't have access
    const plant = plants.find(p => p.id === plantId);
    if (plant) return plant.name;
    
    // If plant isn't in the user's filtered list but they need to see it in history
    if (hasAllLocationsAccess || userLocationId === plantId || 
        isAdmin || userLocationId === 'all') {
      return 'Unknown Plant';
    }
    
    return 'Restricted Plant';
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 p-8">
        <Loader2 className="h-8 w-8 mb-4 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading plant management...</p>
      </div>
    );
  }
  
  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex flex-col space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Plant Management</h1>
        <p className="text-muted-foreground">
          {hasAllLocationsAccess 
            ? "Monitor and control all plant status and maintenance" 
            : "Monitor and control your assigned plant status and maintenance"}
        </p>
      </div>
      
      <Tabs defaultValue="status" value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
        <TabsList>
          <TabsTrigger value="status" className="flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Current Status
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center">
            <ClipboardList className="h-4 w-4 mr-2" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center">
            <History className="h-4 w-4 mr-2" />
            Status History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="status" className="space-y-4 mt-6">
          {plants.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Activity className="h-12 w-12 mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">No Plants Found</p>
                <p className="text-sm text-muted-foreground mb-4">Please add locations in the Locations page first.</p>
                <Button onClick={() => router.push('/dashboard/locations')}>
                  Go to Locations
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plants.map((plant) => (
                <Card key={plant.id} className={`bg-card ${
                  plant.status === 'running' ? 'border-green-500' : 
                  plant.status === 'down' ? 'border-red-500' : 'border-amber-500'
                }`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{plant.name}</CardTitle>
                        <CardDescription>{plant.address}</CardDescription>
                      </div>
                      <Badge 
                        className={
                          plant.status === 'running' ? 'bg-green-500' : 
                          plant.status === 'down' ? 'bg-red-500' : 'bg-amber-500'
                        }
                      >
                        {plant.status === 'running' ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Running
                          </>
                        ) : plant.status === 'down' ? (
                          <>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Down
                          </>
                        ) : (
                          <>
                            <ClipboardList className="h-3 w-3 mr-1" />
                            Maintenance
                          </>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="text-sm">
                        <span className="font-medium">Last Updated:</span> {formatTimestamp(plant.lastUpdated)}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Updated By:</span> {plant.updatedBy ? getUserName(plant.updatedBy) : 'N/A'}
                      </div>
                      {plant.notes && (
                        <div className="text-sm">
                          <span className="font-medium">Notes:</span> {plant.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`status-${plant.id}`}
                          checked={plant.status === 'running'}
                          onCheckedChange={(checked) => togglePlantStatus(plant, checked ? 'running' : 'down')}
                          disabled={plant.status === 'maintenance'}
                        />
                        <Label htmlFor={`status-${plant.id}`}>
                          {plant.status === 'running' ? 'Running' : 'Down'}
                        </Label>
                      </div>
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedPlant(plant);
                          setMaintenanceDialog(true);
                        }}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Maintenance
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="maintenance" className="space-y-4 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Maintenance Records</h2>
            <Button 
              onClick={() => {
                if (plants.length > 0) {
                  setSelectedPlant(plants[0]);
                  setMaintenanceDialog(true);
                }
              }}
              disabled={plants.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule Maintenance
            </Button>
          </div>
          
          {maintenanceRecords.length > 0 ? (
            <div className="space-y-4">
              {maintenanceRecords.map((record) => (
                <Card key={record.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{getPlantName(record.plantId)}</CardTitle>
                        <CardDescription>{record.reason}</CardDescription>
                      </div>
                      <Badge 
                        className={
                          record.status === 'scheduled' ? 'bg-blue-500' : 
                          record.status === 'in-progress' ? 'bg-amber-500' : 'bg-green-500'
                        }
                      >
                        {record.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium mb-1">Start Time</p>
                          <p className="text-sm">{formatTimestamp(record.startTime)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">End Time</p>
                          <p className="text-sm">{record.endTime ? formatTimestamp(record.endTime) : 'Not specified'}</p>
                        </div>
                      </div>
                      
                      {record.notes && (
                        <div>
                          <p className="text-sm font-medium mb-1">Notes</p>
                          <p className="text-sm">{record.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    {record.status !== 'completed' && (
                      <Button variant="outline" className="w-full">
                        {record.status === 'scheduled' ? 'Start Maintenance' : 'Complete Maintenance'}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <ClipboardList className="h-12 w-12 mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">No Maintenance Records</p>
                <p className="text-sm text-muted-foreground mb-4">Schedule maintenance for your plants to see records here.</p>
                <Button 
                  onClick={() => {
                    if (plants.length > 0) {
                      setSelectedPlant(plants[0]);
                      setMaintenanceDialog(true);
                    }
                  }}
                  disabled={plants.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Maintenance
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4 mt-6">
          <h2 className="text-xl font-semibold mb-4">Status Change History</h2>
          
          {statusChanges.length > 0 ? (
            <div className="space-y-2 relative">
              <div className="absolute top-0 bottom-0 left-5 w-0.5 bg-muted z-0"></div>
              
              {statusChanges.map((change, index) => (
                <div key={change.id} className="flex gap-4 relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mt-0.5 ${
                    change.newStatus === 'running' ? 'bg-green-500/20 text-green-500' : 
                    change.newStatus === 'down' ? 'bg-red-500/20 text-red-500' : 
                    'bg-amber-500/20 text-amber-500'
                  }`}>
                    {change.newStatus === 'running' ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : change.newStatus === 'down' ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      <ClipboardList className="h-5 w-5" />
                    )}
                  </div>
                  
                  <div className="flex-1 pb-6">
                    <Card>
                      <CardHeader className="py-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{getPlantName(change.plantId)}</CardTitle>
                          <span className="text-xs text-muted-foreground">{formatTimestamp(change.timestamp)}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="py-2">
                        <p className="text-sm">
                          Status changed from <Badge variant="outline">{change.oldStatus}</Badge> to <Badge variant="outline">{change.newStatus}</Badge>
                        </p>
                        {change.notes && (
                          <p className="text-sm mt-2 text-muted-foreground">{change.notes}</p>
                        )}
                      </CardContent>
                      <CardFooter className="py-2 text-xs text-muted-foreground">
                        Changed by {getUserName(change.changedBy)}
                      </CardFooter>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <History className="h-12 w-12 mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">No Status Changes</p>
                <p className="text-sm text-muted-foreground">Status changes will be recorded here.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Maintenance Dialog */}
      <Dialog open={maintenanceDialog} onOpenChange={setMaintenanceDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Maintenance</DialogTitle>
            <DialogDescription>
              {selectedPlant && `Schedule maintenance for ${selectedPlant.name}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {plants.length > 1 && (
              <div className="grid gap-2">
                <Label htmlFor="plant-select">Plant</Label>
                <select
                  id="plant-select"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedPlant?.id}
                  onChange={(e) => {
                    const plant = plants.find(p => p.id === e.target.value);
                    if (plant) setSelectedPlant(plant);
                  }}
                >
                  {plants.map((plant) => (
                    <option key={plant.id} value={plant.id}>
                      {plant.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason for Maintenance</Label>
              <Input 
                id="reason" 
                value={maintenanceForm.reason}
                onChange={(e) => setMaintenanceForm({...maintenanceForm, reason: e.target.value})}
                placeholder="E.g., Scheduled maintenance, Emergency repair"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input 
                  id="start-date" 
                  type="date"
                  value={maintenanceForm.startDate}
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, startDate: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input 
                  id="start-time" 
                  type="time"
                  value={maintenanceForm.startTime}
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, startTime: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="end-date">End Date (Optional)</Label>
                <Input 
                  id="end-date" 
                  type="date"
                  value={maintenanceForm.endDate}
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, endDate: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end-time">End Time (Optional)</Label>
                <Input 
                  id="end-time" 
                  type="time"
                  value={maintenanceForm.endTime}
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, endTime: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea 
                id="notes" 
                value={maintenanceForm.notes}
                onChange={(e) => setMaintenanceForm({...maintenanceForm, notes: e.target.value})}
                placeholder="Additional details about the maintenance"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaintenanceDialog(false)}>Cancel</Button>
            <Button onClick={scheduleMaintenance}>Schedule Maintenance</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 