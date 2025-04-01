'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/auth-provider';
import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Loader2,
  MapPin,
  PlusCircle,
  Edit,
  Trash2,
  MoreHorizontal,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// Location type definition
interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

// Initial empty location form state
const initialLocationState = {
  name: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
  isActive: true
};

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [locationForm, setLocationForm] = useState(initialLocationState);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const router = useRouter();
  const { userData } = useAuthContext();

  // Redirect if user doesn't have admin role
  useEffect(() => {
    if (userData && userData.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [userData, router]);

  // Fetch locations from Firestore
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
      } catch (error) {
        console.error('Error fetching locations:', error);
        toast.error('Failed to load locations');
      } finally {
        setIsLoading(false);
      }
    }

    fetchLocations();
  }, []);

  // Filter locations based on active tab
  const filteredLocations = locations.filter(location => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return location.isActive;
    if (activeTab === 'inactive') return !location.isActive;
    return true;
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setLocationForm({
      ...locationForm,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!locationForm.name.trim()) {
      newErrors.name = 'Plant name is required';
    }
    
    if (!locationForm.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!locationForm.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!locationForm.state.trim()) {
      newErrors.state = 'State is required';
    }
    
    if (!locationForm.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add new location
  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSaving(true);
    
    try {
      const locationData = {
        ...locationForm,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'locations'), locationData);
      
      // Add to state with the new ID
      setLocations([
        ...locations, 
        { 
          id: docRef.id, 
          ...locationData,
          createdAt: new Date(),
          updatedAt: new Date()
        } as Location
      ]);
      
      toast.success('Location added successfully');
      setShowAddDialog(false);
      setLocationForm(initialLocationState);
    } catch (error) {
      console.error('Error adding location:', error);
      toast.error('Failed to add location');
    } finally {
      setIsSaving(false);
    }
  };

  // Edit location
  const handleEditLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !currentLocation) return;
    
    setIsSaving(true);
    
    try {
      const locationRef = doc(db, 'locations', currentLocation.id);
      
      await updateDoc(locationRef, {
        ...locationForm,
        updatedAt: serverTimestamp()
      });
      
      // Update in state
      setLocations(locations.map(loc => 
        loc.id === currentLocation.id 
          ? { 
              ...loc, 
              ...locationForm, 
              updatedAt: new Date() 
            } 
          : loc
      ));
      
      toast.success('Location updated successfully');
      setShowEditDialog(false);
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Failed to update location');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete location
  const handleDeleteLocation = async () => {
    if (!currentLocation) return;
    
    try {
      await deleteDoc(doc(db, 'locations', currentLocation.id));
      
      // Remove from state
      setLocations(locations.filter(loc => loc.id !== currentLocation.id));
      
      toast.success('Location deleted successfully');
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Failed to delete location');
    }
  };

  // Open edit dialog with location data
  const openEditDialog = (location: Location) => {
    setCurrentLocation(location);
    setLocationForm({
      name: location.name,
      address: location.address,
      city: location.city,
      state: location.state,
      zipCode: location.zipCode,
      phone: location.phone,
      isActive: location.isActive
    });
    setShowEditDialog(true);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (location: Location) => {
    setCurrentLocation(location);
    setShowDeleteDialog(true);
  };

  // Reset form
  const resetForm = () => {
    setLocationForm(initialLocationState);
    setErrors({});
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Location Management</h1>
          <p className="text-white opacity-70">Manage your asphalt plant locations</p>
        </div>
        <Button onClick={() => {
          resetForm();
          setShowAddDialog(true);
        }} className="bg-[#EFCD00] hover:bg-[#EFCD00]/90 text-black">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      <Card className="bg-[#121212] border-gray-800 text-white">
        <CardHeader>
          <CardTitle>Plant Locations</CardTitle>
          <CardDescription className="text-white opacity-70">
            View and manage your company's asphalt production plants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
            <TabsList className="bg-[#1a1a1a] p-0.5">
              <TabsTrigger
                value="all"
                className="px-4 py-2"
              >
                All Locations
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="px-4 py-2"
              >
                Active
              </TabsTrigger>
              <TabsTrigger
                value="inactive"
                className="px-4 py-2"
              >
                Inactive
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 text-[#EFCD00] animate-spin" />
              <span className="ml-2">Loading locations...</span>
            </div>
          ) : locations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-gray-700 rounded-lg">
              <MapPin className="h-12 w-12 text-gray-500 mb-4" />
              <h3 className="text-lg text-gray-300 mb-2">No Locations Found</h3>
              <p className="text-gray-400 text-center max-w-md mb-4">
                You haven't added any asphalt plant locations yet. Add your first location to get started.
              </p>
              <Button onClick={() => {
                resetForm();
                setShowAddDialog(true);
              }} className="bg-[#EFCD00] hover:bg-[#EFCD00]/90 text-black">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Your First Location
              </Button>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="flex items-center justify-center h-64 border border-dashed border-gray-700 rounded-lg">
              <AlertCircle className="h-6 w-6 text-gray-500 mr-2" />
              <span className="text-gray-400">No {activeTab === 'active' ? 'active' : 'inactive'} locations found</span>
            </div>
          ) : (
            <div className="rounded-md border border-white/20 overflow-hidden">
              <Table>
                <TableHeader className="bg-[#1a1a1a]">
                  <TableRow>
                    <TableHead className="text-white">Plant Name</TableHead>
                    <TableHead className="text-white">Address</TableHead>
                    <TableHead className="text-white">Phone</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocations.map((location) => (
                    <TableRow key={location.id} className="border-t border-white/10">
                      <TableCell className="font-medium text-white">{location.name}</TableCell>
                      <TableCell className="text-white opacity-80">
                        {location.address}, {location.city}, {location.state} {location.zipCode}
                      </TableCell>
                      <TableCell className="text-white opacity-80">{location.phone || 'N/A'}</TableCell>
                      <TableCell>
                        {location.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-900/30 text-gray-400 border border-gray-800">
                            Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4 text-white" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-gray-700 text-white">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-gray-700" />
                            <DropdownMenuItem 
                              onClick={() => openEditDialog(location)}
                              className="hover:bg-white/10 cursor-pointer"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => router.push(`/dashboard/hours?locationId=${location.id}`)}
                              className="hover:bg-white/10 cursor-pointer"
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Manage Hours
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(location)}
                              className="text-red-400 hover:bg-red-900/20 hover:text-red-400 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Location Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-[#121212] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
            <DialogDescription className="text-white opacity-70">
              Add a new asphalt plant location to your system
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddLocation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">Plant Name *</Label>
              <Input
                id="name"
                name="name"
                value={locationForm.name}
                onChange={handleInputChange}
                className="bg-[#1a1a1a] border-gray-700 text-white"
                placeholder="Main Plant"
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-gray-300">Address *</Label>
              <Input
                id="address"
                name="address"
                value={locationForm.address}
                onChange={handleInputChange}
                className="bg-[#1a1a1a] border-gray-700 text-white"
                placeholder="123 Main St"
              />
              {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-gray-300">City *</Label>
                <Input
                  id="city"
                  name="city"
                  value={locationForm.city}
                  onChange={handleInputChange}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  placeholder="Jacksonville"
                />
                {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state" className="text-gray-300">State *</Label>
                <Input
                  id="state"
                  name="state"
                  value={locationForm.state}
                  onChange={handleInputChange}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  placeholder="FL"
                />
                {errors.state && <p className="text-red-500 text-sm">{errors.state}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode" className="text-gray-300">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  value={locationForm.zipCode}
                  onChange={handleInputChange}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  placeholder="32256"
                />
                {errors.zipCode && <p className="text-red-500 text-sm">{errors.zipCode}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={locationForm.phone}
                onChange={handleInputChange}
                className="bg-[#1a1a1a] border-gray-700 text-white"
                placeholder="(904) 555-1234"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                className="rounded border-gray-700 bg-[#1a1a1a]"
                checked={locationForm.isActive}
                onChange={handleInputChange}
              />
              <Label htmlFor="isActive" className="text-gray-300">Active Location</Label>
            </div>
            
            <DialogFooter>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setShowAddDialog(false)}
                className="border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSaving}
                className="bg-[#EFCD00] hover:bg-[#EFCD00]/90 text-black"
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Adding...' : 'Add Location'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Location Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-[#121212] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription className="text-white opacity-70">
              Update the details of this plant location
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditLocation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-gray-300">Plant Name *</Label>
              <Input
                id="edit-name"
                name="name"
                value={locationForm.name}
                onChange={handleInputChange}
                className="bg-[#1a1a1a] border-gray-700 text-white"
                placeholder="Main Plant"
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address" className="text-gray-300">Address *</Label>
              <Input
                id="edit-address"
                name="address"
                value={locationForm.address}
                onChange={handleInputChange}
                className="bg-[#1a1a1a] border-gray-700 text-white"
                placeholder="123 Main St"
              />
              {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-city" className="text-gray-300">City *</Label>
                <Input
                  id="edit-city"
                  name="city"
                  value={locationForm.city}
                  onChange={handleInputChange}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  placeholder="Jacksonville"
                />
                {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-state" className="text-gray-300">State *</Label>
                <Input
                  id="edit-state"
                  name="state"
                  value={locationForm.state}
                  onChange={handleInputChange}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  placeholder="FL"
                />
                {errors.state && <p className="text-red-500 text-sm">{errors.state}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-zipCode" className="text-gray-300">ZIP Code *</Label>
                <Input
                  id="edit-zipCode"
                  name="zipCode"
                  value={locationForm.zipCode}
                  onChange={handleInputChange}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  placeholder="32256"
                />
                {errors.zipCode && <p className="text-red-500 text-sm">{errors.zipCode}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone" className="text-gray-300">Phone Number</Label>
              <Input
                id="edit-phone"
                name="phone"
                value={locationForm.phone}
                onChange={handleInputChange}
                className="bg-[#1a1a1a] border-gray-700 text-white"
                placeholder="(904) 555-1234"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-isActive"
                name="isActive"
                className="rounded border-gray-700 bg-[#1a1a1a]"
                checked={locationForm.isActive}
                onChange={handleInputChange}
              />
              <Label htmlFor="edit-isActive" className="text-gray-300">Active Location</Label>
            </div>
            
            <DialogFooter>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
                className="border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSaving}
                className="bg-[#EFCD00] hover:bg-[#EFCD00]/90 text-black"
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-[#121212] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete Location</DialogTitle>
            <DialogDescription className="text-white opacity-70">
              Are you sure you want to delete this location? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {currentLocation && (
            <div className="py-4">
              <p className="text-white mb-2">
                <span className="font-semibold">Plant Name:</span> {currentLocation.name}
              </p>
              <p className="text-white mb-2">
                <span className="font-semibold">Address:</span> {currentLocation.address}, {currentLocation.city}, {currentLocation.state} {currentLocation.zipCode}
              </p>
              <div className="mt-4 border-t border-gray-800 pt-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                  <p className="text-amber-500 text-sm">
                    Warning: Deleting this location will remove all associated data, including operating hours and staff assignments.
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              className="border-white/30 text-white hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteLocation}
              className="bg-red-600 hover:bg-red-700 border-none"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 