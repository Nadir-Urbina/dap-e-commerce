'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { User, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthContext } from '@/components/auth-provider';
import { ArrowLeft, Loader2, Save, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { use } from 'react';

interface Location {
  id: string;
  name: string;
}

export default function UserForm({ params }: { params: { id: string } }) {
  // Properly access params using React.use to unwrap the Promise
  const unwrappedParams = use(params);
  const isNewUser = unwrappedParams.id === 'new';
  const userId = isNewUser ? null : unwrappedParams.id;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
    role: 'customer' as UserRole,
    locationId: 'none' // Changed from empty string to 'none'
  });
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  
  const router = useRouter();
  const { userData } = useAuthContext();
  const auth = getAuth();

  // Redirect if not admin
  useEffect(() => {
    if (userData && userData.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [userData, router]);

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const locationsCollection = collection(db, 'locations');
        const snapshot = await getDocs(locationsCollection);
        const locationsList = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setLocations(locationsList);
      } catch (error) {
        console.error('Error fetching locations:', error);
        toast.error('Failed to load locations');
      }
    };

    fetchLocations();
  }, []);

  // Fetch user data if editing existing user
  useEffect(() => {
    const fetchUser = async () => {
      if (isNewUser) {
        setIsLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', unwrappedParams.id));
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setFormData({
            email: userData.email || '',
            password: '', // Don't show existing password
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            company: userData.company || '',
            phone: userData.phone || '',
            role: userData.role || 'customer',
            locationId: userData.locationId || 'none' // Changed from empty string to 'none'
          });
        } else {
          toast.error('User not found');
          router.push('/dashboard/users');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        toast.error('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [isNewUser, unwrappedParams.id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (name in formErrors) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    const errors = {
      email: '',
      password: '',
      firstName: '',
      lastName: ''
    };
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    if (isNewUser && !formData.password) {
      errors.password = 'Password is required for new users';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.firstName) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName) {
      errors.lastName = 'Last name is required';
    }
    
    setFormErrors(errors);
    
    return !Object.values(errors).some(error => error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (isNewUser) {
        // Alternative approach: Create an admin-only API endpoint
        try {
          const response = await fetch('/api/admin/create-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password,
              firstName: formData.firstName,
              lastName: formData.lastName,
              company: formData.company,
              phone: formData.phone,
              role: formData.role,
              locationId: formData.locationId === 'none' ? null : 
                        formData.locationId === 'all' ? 'all' : formData.locationId,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            
            // Special handling for email-already-in-use
            if (errorData.code === 'auth/email-already-in-use' || 
                errorData.message?.includes('email is already in use')) {
              // Set the form error
              setFormErrors(prev => ({ 
                ...prev, 
                email: 'This email is already in use' 
              }));
              
              // Also show a toast for better visibility
              toast.error('This email address is already registered in the system');
              
              setIsSaving(false);
              return; // Exit early to avoid additional generic error message
            }
            
            throw new Error(errorData.message || 'Failed to create user');
          }

          toast.success('User created successfully');
          router.push('/dashboard/users');
        } catch (error: any) {
          console.error('Error creating user:', error);
          
          // Improved error handling for email-already-in-use
          if (error.message?.includes('email-already-in-use') || 
              error.code === 'auth/email-already-in-use') {
            // Set form error
            setFormErrors(prev => ({ 
              ...prev, 
              email: 'This email is already in use' 
            }));
            
            // Also show toast for better visibility
            toast.error('This email address is already registered in the system');
          } else {
            toast.error(`Failed to create user: ${error.message}`);
          }
          setIsSaving(false);
        }
      } else {
        // Update existing user - this remains the same
        const userRef = doc(db, 'users', unwrappedParams.id);
        
        await updateDoc(userRef, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          company: formData.company,
          phone: formData.phone,
          role: formData.role,
          locationId: formData.locationId === 'none' ? null : 
                     formData.locationId === 'all' ? 'all' : formData.locationId,
          updatedAt: new Date()
        });
        
        toast.success('User updated successfully');
        router.push('/dashboard/users');
      }
    } catch (error: any) {
      console.error('Error saving user:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        setFormErrors(prev => ({ 
          ...prev, 
          email: 'This email is already in use' 
        }));
      } else {
        toast.error(`Failed to ${isNewUser ? 'create' : 'update'} user: ${error.message}`);
      }
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-6 w-6 text-[#EFCD00] animate-spin" />
        <p className="ml-2">Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard/users')}
          className="mr-4 text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-white">
          {isNewUser ? 'Create New User' : 'Edit User'}
        </h1>
      </div>
      
      <Card className="bg-[#121212] border-gray-800 text-white">
        <CardHeader>
          <CardTitle>{isNewUser ? 'New User' : 'Edit User Details'}</CardTitle>
          <CardDescription className="text-white opacity-70">
            {isNewUser 
              ? 'Create a new user account with appropriate role and permissions' 
              : 'Update user information and permissions'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="user-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-300">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="bg-[#1a1a1a] border-gray-700 text-white"
                    placeholder="John"
                  />
                  {formErrors.firstName && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.firstName}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-300">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="bg-[#1a1a1a] border-gray-700 text-white"
                    placeholder="Doe"
                  />
                  {formErrors.lastName && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.lastName}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`bg-[#1a1a1a] border-gray-700 text-white ${
                    formErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''
                  }`}
                  placeholder="john.doe@example.com"
                  disabled={!isNewUser} // Can't change email for existing users
                />
                {formErrors.email && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
                )}
              </div>
              
              {isNewUser && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      className="bg-[#1a1a1a] border-gray-700 text-white pr-10"
                      placeholder="••••••••"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                      onClick={() => setShowPassword(prev => !prev)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showPassword ? "Hide password" : "Show password"}
                      </span>
                    </Button>
                  </div>
                  {formErrors.password && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.password}</p>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-gray-300">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="bg-[#1a1a1a] border-gray-700 text-white"
                    placeholder="Company Name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-300">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="bg-[#1a1a1a] border-gray-700 text-white"
                    placeholder="(123) 456-7890"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-gray-300">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleSelectChange('role', value)}
                  >
                    <SelectTrigger className="bg-[#1a1a1a] border-gray-700 text-white">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-gray-700 text-white">
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-gray-300">Location</Label>
                  <Select
                    value={formData.locationId}
                    onValueChange={(value) => handleSelectChange('locationId', value)}
                  >
                    <SelectTrigger className="bg-[#1a1a1a] border-gray-700 text-white">
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-gray-700 text-white">
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="all">All Locations</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-gray-800 pt-6">
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/users')}
            className="border-white/30 text-white hover:bg-white/10 hover:text-white"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            form="user-form"
            disabled={isSaving}
            className="bg-[#EFCD00] hover:bg-[#EFCD00]/90 text-black"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save User'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 