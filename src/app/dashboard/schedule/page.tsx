'use client';

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Calendar, CalendarRange } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Define the scheduled production interface
interface ScheduledProduction {
  id: string;
  date: Timestamp;
  plantId: string;
  plantName?: string;
  mixIds: string[];
  mixNames?: string[];
  notes?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Define interface for locations and mixes
interface Location {
  id: string;
  name: string;
}

interface AsphaltProduct {
  id: string;
  name: string;
  shortDescription: string;
  category: string;
}

export default function ProductionSchedulePage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [schedule, setSchedule] = useState<ScheduledProduction[]>([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [locations, setLocations] = useState<Location[]>([]);
  const [mixes, setMixes] = useState<AsphaltProduct[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  
  // New state for form data
  const [newSchedule, setNewSchedule] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    plantId: '',
    plantName: '',
    mixIds: [''],
    mixNames: [''],
    notes: '',
    status: 'scheduled' as 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  });

  // Function to fetch schedule data
  const fetchSchedule = async () => {
    try {
      setIsLoading(true);
      
      // Reference to the production schedule collection
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const scheduleRef = collection(db, "productionSchedule");
      const scheduleQuery = query(
        scheduleRef,
        where("date", ">=", Timestamp.fromDate(today))
      );
      
      const querySnapshot = await getDocs(scheduleQuery);
      const scheduledProduction: ScheduledProduction[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<ScheduledProduction, 'id'>;
        scheduledProduction.push({
          id: doc.id,
          ...data
        });
      });
      
      // Sort by date
      scheduledProduction.sort((a, b) => a.date.toMillis() - b.date.toMillis());
      
      setSchedule(scheduledProduction);
    } catch (error) {
      console.error("Error fetching production schedule:", error);
      toast({
        title: "Error",
        description: "Failed to load production schedule. Using demo data instead.",
        variant: "destructive",
      });
      
      // Use dummy data if firestore permissions fail
      if (isAdmin) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        setSchedule([
          {
            id: 'demo-1',
            date: Timestamp.fromDate(tomorrow),
            plantId: 'plant-1',
            plantName: 'North Plant',
            mixIds: ['mix-1', 'mix-2'],
            mixNames: ['S-III Mix', 'Standard Asphalt'],
            notes: 'Demo data - first production run',
            status: 'scheduled',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          },
          {
            id: 'demo-2',
            date: Timestamp.fromDate(nextWeek),
            plantId: 'plant-2',
            plantName: 'South Plant',
            mixIds: ['mix-3'],
            mixNames: ['Premium Mix'],
            notes: 'Demo data - special order',
            status: 'scheduled',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch locations
  const fetchLocations = async () => {
    try {
      setIsLoadingOptions(true);
      const locationsRef = collection(db, "locations");
      const querySnapshot = await getDocs(locationsRef);
      
      const locationData: Location[] = [];
      querySnapshot.forEach((doc) => {
        locationData.push({
          id: doc.id,
          name: doc.data().name || doc.data().locationName || `Location ${doc.id}`
        });
      });
      
      setLocations(locationData);
    } catch (error) {
      console.error("Error fetching locations:", error);
      // Use dummy data if fetch fails
      setLocations([
        { id: 'location-1', name: 'North Plant' },
        { id: 'location-2', name: 'South Plant' },
        { id: 'location-3', name: 'East Facility' }
      ]);
    } finally {
      setIsLoadingOptions(false);
    }
  };
  
  // Function to fetch asphalt mixes
  const fetchMixes = async () => {
    try {
      setIsLoadingOptions(true);
      const productsRef = collection(db, "products");
      const querySnapshot = await getDocs(productsRef);
      
      const mixData: AsphaltProduct[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Only include products with category HMA
        if (data.category === "HMA") {
          mixData.push({
            id: doc.id,
            name: data.name || "",
            shortDescription: data.shortDescription || data.name || `Mix ${doc.id}`,
            category: data.category
          });
        }
      });
      
      setMixes(mixData);
    } catch (error) {
      console.error("Error fetching mixes:", error);
      // Use dummy data if fetch fails
      setMixes([
        { id: 'mix-1', name: 'S-III Mix', shortDescription: 'S-III Traffic Level C', category: 'HMA' },
        { id: 'mix-2', name: 'Standard Asphalt', shortDescription: 'SP-12.5 Traffic Level B', category: 'HMA' },
        { id: 'mix-3', name: 'Premium Mix', shortDescription: 'SP-9.5 Traffic Level E', category: 'HMA' },
        { id: 'mix-4', name: 'FDOT Approved Mix', shortDescription: 'FC-12.5 Friction Course', category: 'HMA' }
      ]);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  // Fetch locations and mixes when dialog is opened
  useEffect(() => {
    if (dialogOpen) {
      fetchLocations();
      fetchMixes();
    }
  }, [dialogOpen]);

  useEffect(() => {
    console.log("Auth state:", { user, userData: user?.uid, isAdmin });
    
    if (!user) {
      // Wait to confirm no user before redirecting
      const timeout = setTimeout(() => {
        router.push("/login");
      }, 1000);
      return () => clearTimeout(timeout);
    }
    
    // Don't redirect if permissions fail, just show empty state
    fetchSchedule();
  }, [user, isAdmin, router]);

  // Filter schedule based on active tab
  const filteredSchedule = schedule.filter(item => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (activeTab === "upcoming") {
      return item.date.toDate() >= today && item.status !== 'completed' && item.status !== 'cancelled';
    } else if (activeTab === "completed") {
      return item.status === 'completed';
    } else if (activeTab === "all") {
      return true;
    }
    return false;
  });

  // Format date for display
  const formatDate = (timestamp: Timestamp) => {
    return format(timestamp.toDate(), "MMMM d, yyyy");
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string, value: string } }) => {
    const { name, value } = e.target;
    setNewSchedule(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle plant selection
  const handlePlantSelect = (value: string) => {
    const selectedLocation = locations.find(loc => loc.id === value);
    setNewSchedule(prev => ({
      ...prev,
      plantId: value,
      plantName: selectedLocation?.name || ''
    }));
  };
  
  // Handle mix selection
  const handleMixSelect = (value: string) => {
    const selectedMix = mixes.find(mix => mix.id === value);
    setNewSchedule(prev => ({
      ...prev,
      mixIds: [value],
      mixNames: [selectedMix?.shortDescription || '']
    }));
  };
  
  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!newSchedule.date) errors.date = "Date is required";
    if (!newSchedule.plantId) errors.plantId = "Plant selection is required";
    if (!newSchedule.mixIds[0]) errors.mixIds = "Mix type selection is required";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Save new schedule
  const saveNewSchedule = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSaving(true);
      
      const scheduleDate = new Date(newSchedule.date);
      scheduleDate.setHours(8, 0, 0, 0); // Default to 8 AM
      
      await addDoc(collection(db, "productionSchedule"), {
        date: Timestamp.fromDate(scheduleDate),
        plantId: newSchedule.plantId,
        plantName: newSchedule.plantName,
        mixIds: newSchedule.mixIds.filter(id => id.trim() !== ''),
        mixNames: newSchedule.mixNames.filter(name => name.trim() !== ''),
        notes: newSchedule.notes,
        status: newSchedule.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      toast({
        title: "Success",
        description: "Production schedule created successfully",
      });
      
      // Reset form and close dialog
      setNewSchedule({
        date: format(new Date(), 'yyyy-MM-dd'),
        plantId: '',
        plantName: '',
        mixIds: [''],
        mixNames: [''],
        notes: '',
        status: 'scheduled'
      });
      setDialogOpen(false);
      
      // Refresh schedule data
      fetchSchedule();
    } catch (error) {
      console.error("Error creating production schedule:", error);
      toast({
        title: "Error",
        description: "Failed to create production schedule",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Schedule</h1>
          <p className="text-muted-foreground">
            View and manage the production schedule
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSchedule}
          >
            <Loader2 className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-xl text-white">Create New Production Schedule</DialogTitle>
                <DialogDescription className="text-slate-300">
                  Add a new production schedule for an upcoming date.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="date" className="text-left text-white font-medium">
                    Date
                  </Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={newSchedule.date}
                    onChange={handleInputChange}
                    className={`bg-slate-800 border-slate-600 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 ${formErrors.date ? "border-red-500" : ""}`}
                  />
                  {formErrors.date && (
                    <p className="text-red-400 text-sm">{formErrors.date}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="plantName" className="text-left text-white font-medium">
                    Plant Name
                  </Label>
                  <Select 
                    onValueChange={handlePlantSelect}
                    defaultValue={newSchedule.plantId}
                  >
                    <SelectTrigger className={`bg-slate-800 border-slate-600 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 ${formErrors.plantId ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Select plant" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      {isLoadingOptions ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Loading plants...</span>
                        </div>
                      ) : locations.length === 0 ? (
                        <div className="p-2 text-center text-slate-400">No plants available</div>
                      ) : (
                        locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {formErrors.plantId && (
                    <p className="text-red-400 text-sm">{formErrors.plantId}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mixNames" className="text-left text-white font-medium">
                    Mix Type
                  </Label>
                  <Select 
                    onValueChange={handleMixSelect}
                    defaultValue={newSchedule.mixIds[0]}
                  >
                    <SelectTrigger className={`bg-slate-800 border-slate-600 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 ${formErrors.mixIds ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Select mix type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      {isLoadingOptions ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Loading mixes...</span>
                        </div>
                      ) : mixes.length === 0 ? (
                        <div className="p-2 text-center text-slate-400">No HMA mixes available</div>
                      ) : (
                        mixes.map((mix) => (
                          <SelectItem key={mix.id} value={mix.id}>
                            {mix.shortDescription}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {formErrors.mixIds && (
                    <p className="text-red-400 text-sm">{formErrors.mixIds}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status" className="text-left text-white font-medium">
                    Status
                  </Label>
                  <Select 
                    onValueChange={(value) => handleInputChange({ target: { name: 'status', value } })}
                    defaultValue={newSchedule.status}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="scheduled" className="focus:bg-slate-700 focus:text-white">Scheduled</SelectItem>
                      <SelectItem value="in-progress" className="focus:bg-slate-700 focus:text-white">In Progress</SelectItem>
                      <SelectItem value="completed" className="focus:bg-slate-700 focus:text-white">Completed</SelectItem>
                      <SelectItem value="cancelled" className="focus:bg-slate-700 focus:text-white">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes" className="text-left text-white font-medium">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Add any special instructions or notes"
                    value={newSchedule.notes}
                    onChange={handleInputChange}
                    className="bg-slate-800 border-slate-600 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 min-h-24"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} 
                  className="bg-transparent border-slate-600 text-white hover:bg-slate-800 hover:text-white">
                  Cancel
                </Button>
                <Button onClick={saveNewSchedule} disabled={isSaving}
                  className="bg-yellow-500 text-black hover:bg-yellow-400 hover:text-black">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Schedule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredSchedule.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No scheduled production</h3>
                <p className="text-muted-foreground">
                  {activeTab === "upcoming" 
                    ? "There are no upcoming production schedules."
                    : activeTab === "completed" 
                      ? "There are no completed production schedules."
                      : "There are no production schedules available."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSchedule.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      {item.plantName || `Plant ${item.plantId}`}
                    </CardTitle>
                    <CardDescription className="flex items-center">
                      <CalendarRange className="mr-2 h-4 w-4" />
                      {formatDate(item.date)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Mix Types:</p>
                      <ul className="text-sm text-muted-foreground">
                        {item.mixNames ? (
                          item.mixNames.map((name, index) => (
                            <li key={index}>{name}</li>
                          ))
                        ) : (
                          item.mixIds.map((id, index) => (
                            <li key={index}>Mix ID: {id}</li>
                          ))
                        )}
                      </ul>
                    </div>
                    {item.notes && (
                      <div className="mt-3 space-y-1">
                        <p className="text-sm font-medium">Notes:</p>
                        <p className="text-sm text-muted-foreground">{item.notes}</p>
                      </div>
                    )}
                    <div className="mt-3">
                      <p className="text-sm font-medium">Status:</p>
                      <div className={`mt-1 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium
                        ${item.status === 'scheduled' ? 'bg-blue-50 text-blue-700' : 
                          item.status === 'in-progress' ? 'bg-yellow-50 text-yellow-700' : 
                          item.status === 'completed' ? 'bg-green-50 text-green-700' : 
                          'bg-red-50 text-red-700'}`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-1">
                    <Button variant="outline" className="w-full">View Details</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 