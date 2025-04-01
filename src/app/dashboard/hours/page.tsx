'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/components/auth-provider';
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  setDoc,
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimePickerInput } from '@/components/ui/time-picker-input';
import {
  Loader2,
  Clock,
  Save,
  AlertCircle,
  ArrowLeft,
  Calendar,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface DayHours {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface OperatingHours {
  locationId: string;
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
  specialNotes: string;
  updatedAt: any;
}

// Default hours template
const defaultHours: Omit<OperatingHours, 'locationId' | 'updatedAt'> = {
  monday: { isOpen: true, openTime: '07:00', closeTime: '17:00' },
  tuesday: { isOpen: true, openTime: '07:00', closeTime: '17:00' },
  wednesday: { isOpen: true, openTime: '07:00', closeTime: '17:00' },
  thursday: { isOpen: true, openTime: '07:00', closeTime: '17:00' },
  friday: { isOpen: true, openTime: '07:00', closeTime: '17:00' },
  saturday: { isOpen: false, openTime: '08:00', closeTime: '12:00' },
  sunday: { isOpen: false, openTime: '08:00', closeTime: '12:00' },
  specialNotes: ''
};

export default function HoursPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [operatingHours, setOperatingHours] = useState<OperatingHours | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [specialNotes, setSpecialNotes] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userData } = useAuthContext();
  
  // Get any locationId from URL params
  const locationIdParam = searchParams.get('locationId');

  // Redirect if user doesn't have admin role
  useEffect(() => {
    if (userData && userData.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [userData, router]);

  // Fetch all locations
  useEffect(() => {
    async function fetchLocations() {
      try {
        setIsLoading(true);
        const locationsCollection = collection(db, 'locations');
        const locationsSnapshot = await getDocs(locationsCollection);
        const locationsList = locationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Location));
        
        setLocations(locationsList);
        
        // If locationId is in URL params, select it
        if (locationIdParam && locationsList.some(loc => loc.id === locationIdParam)) {
          setSelectedLocationId(locationIdParam);
        } else if (locationsList.length > 0) {
          // Otherwise select the first location
          setSelectedLocationId(locationsList[0].id);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
        toast.error('Failed to load locations');
      } finally {
        setIsLoading(false);
      }
    }

    fetchLocations();
  }, [locationIdParam]);

  // When a location is selected, fetch its hours
  useEffect(() => {
    if (!selectedLocationId) return;
    
    async function fetchLocationHours() {
      try {
        setIsLoading(true);
        
        // Get the selected location details
        const selectedLoc = locations.find(loc => loc.id === selectedLocationId) || null;
        setSelectedLocation(selectedLoc);
        
        // Get the hours for this location
        const hoursRef = doc(db, 'operatingHours', selectedLocationId);
        const hoursSnap = await getDoc(hoursRef);
        
        if (hoursSnap.exists()) {
          const hoursData = hoursSnap.data() as OperatingHours;
          setOperatingHours(hoursData);
          setSpecialNotes(hoursData.specialNotes || '');
        } else {
          // Create default hours object for this location
          const newHours: OperatingHours = {
            locationId: selectedLocationId,
            ...defaultHours,
            updatedAt: new Date() // Will be properly set when saving
          };
          setOperatingHours(newHours);
          setSpecialNotes(newHours.specialNotes);
        }
        
        setHasChanges(false);
      } catch (error) {
        console.error('Error fetching operating hours:', error);
        toast.error('Failed to load operating hours');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchLocationHours();
  }, [selectedLocationId, locations]);

  // Update hours for a specific day
  const updateDayHours = (day: keyof Omit<OperatingHours, 'locationId' | 'updatedAt' | 'specialNotes'>, field: keyof DayHours, value: boolean | string) => {
    if (!operatingHours) return;
    
    setOperatingHours(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        [day]: {
          ...prev[day],
          [field]: value
        }
      };
    });
    
    setHasChanges(true);
  };

  // Update special notes
  const updateSpecialNotes = (notes: string) => {
    setSpecialNotes(notes);
    setHasChanges(true);
  };

  // Save operating hours to Firestore
  const saveOperatingHours = async () => {
    if (!operatingHours || !selectedLocationId) return;
    
    setIsSaving(true);
    
    try {
      const hoursRef = doc(db, 'operatingHours', selectedLocationId);
      
      // Update with current special notes and timestamp
      const updatedHours = {
        ...operatingHours,
        specialNotes,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(hoursRef, updatedHours);
      
      toast.success('Operating hours updated successfully');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving operating hours:', error);
      toast.error('Failed to save operating hours');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset hours to defaults
  const resetToDefaults = () => {
    if (!selectedLocationId) return;
    
    setOperatingHours({
      locationId: selectedLocationId,
      ...defaultHours,
      updatedAt: new Date()
    });
    
    setSpecialNotes(defaultHours.specialNotes);
    setHasChanges(true);
  };

  // Days of the week for rendering
  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ] as const;

  // If no locations have been added yet
  if (locations.length === 0 && !isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Operating Hours</h1>
            <p className="text-white opacity-70">Manage your plant operating hours</p>
          </div>
          <Button onClick={() => router.push('/dashboard/locations')} className="bg-[#EFCD00] hover:bg-[#EFCD00]/90 text-black">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Manage Locations
          </Button>
        </div>
        
        <Card className="bg-[#121212] border-gray-800 text-white">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-gray-700 rounded-lg">
              <Clock className="h-12 w-12 text-gray-500 mb-4" />
              <h3 className="text-lg text-gray-300 mb-2">No Locations Found</h3>
              <p className="text-gray-400 text-center max-w-md mb-4">
                You need to add at least one plant location before setting operating hours.
              </p>
              <Button onClick={() => router.push('/dashboard/locations')} className="bg-[#EFCD00] hover:bg-[#EFCD00]/90 text-black">
                Add Plant Location
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Operating Hours</h1>
          <p className="text-white opacity-70">Manage your plant operating schedules</p>
        </div>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/locations')}
            className="border-white/30 text-white hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Locations
          </Button>
          <Button 
            onClick={saveOperatingHours}
            disabled={isSaving || !hasChanges}
            className="bg-[#EFCD00] hover:bg-[#EFCD00]/90 text-black"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Card className="bg-[#121212] border-gray-800 text-white">
        <CardHeader>
          <CardTitle>Operating Hours</CardTitle>
          <CardDescription className="text-white opacity-70">
            Set the operating hours for each of your plant locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 text-[#EFCD00] animate-spin" />
              <span className="ml-2">Loading hours...</span>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <Label htmlFor="locationSelect" className="block mb-2 text-white">
                  Select Location
                </Label>
                <Select
                  value={selectedLocationId}
                  onValueChange={setSelectedLocationId}
                >
                  <SelectTrigger className="w-full bg-[#1a1a1a] border-gray-700 text-white focus:ring-[#EFCD00] focus:ring-opacity-50">
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-700 text-white">
                    {locations.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedLocation && operatingHours && (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-white">
                      {selectedLocation.name}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetToDefaults}
                      className="border-white/30 text-white hover:bg-white/10 hover:text-white"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset to Defaults
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="rounded-md border border-gray-700 overflow-hidden">
                      <div className="grid grid-cols-[1fr_2fr_2fr_1fr] bg-[#1a1a1a] p-3 border-b border-gray-700">
                        <div className="font-medium text-white">Day</div>
                        <div className="font-medium text-white">Open Time</div>
                        <div className="font-medium text-white">Close Time</div>
                        <div className="font-medium text-white">Status</div>
                      </div>
                      
                      {daysOfWeek.map(day => (
                        <div 
                          key={day.key} 
                          className="grid grid-cols-[1fr_2fr_2fr_1fr] p-3 border-b border-gray-700 last:border-b-0 items-center"
                        >
                          <div className="text-white">{day.label}</div>
                          <div>
                            <div className="relative">
                              <Input
                                type="time"
                                value={operatingHours[day.key].openTime}
                                onChange={(e) => updateDayHours(day.key, 'openTime', e.target.value)}
                                disabled={!operatingHours[day.key].isOpen}
                                className="bg-[#1a1a1a] border-gray-700 text-white max-w-[120px]"
                              />
                            </div>
                          </div>
                          <div>
                            <div className="relative">
                              <Input
                                type="time"
                                value={operatingHours[day.key].closeTime}
                                onChange={(e) => updateDayHours(day.key, 'closeTime', e.target.value)}
                                disabled={!operatingHours[day.key].isOpen}
                                className="bg-[#1a1a1a] border-gray-700 text-white max-w-[120px]"
                              />
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`isOpen-${day.key}`}
                              checked={operatingHours[day.key].isOpen}
                              onCheckedChange={(checked) => 
                                updateDayHours(day.key, 'isOpen', checked as boolean)
                              }
                              className="border-gray-500 focus:ring-[#EFCD00]"
                            />
                            <Label 
                              htmlFor={`isOpen-${day.key}`}
                              className={`text-sm ${operatingHours[day.key].isOpen ? 'text-white' : 'text-gray-400'}`}
                            >
                              {operatingHours[day.key].isOpen ? 'Open' : 'Closed'}
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6">
                      <Label htmlFor="specialNotes" className="block mb-2 text-white">
                        Special Notes
                      </Label>
                      <Input
                        id="specialNotes"
                        placeholder="Holiday hours, special closures, etc."
                        value={specialNotes}
                        onChange={(e) => updateSpecialNotes(e.target.value)}
                        className="bg-[#1a1a1a] border-gray-700 text-white"
                      />
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <Button 
                        onClick={saveOperatingHours}
                        disabled={isSaving || !hasChanges}
                        className="bg-[#EFCD00] hover:bg-[#EFCD00]/90 text-black"
                      >
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Hours'}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 