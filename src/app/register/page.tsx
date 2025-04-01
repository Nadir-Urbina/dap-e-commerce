'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function RequestAccountPage() {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic validation
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.company || !formData.phone) {
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    try {
      // Save request to Firestore
      await addDoc(collection(db, 'accountRequests'), {
        ...formData,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      setIsSubmitted(true);
      toast.success('Your account request has been submitted!');
    } catch (error: any) {
      console.error('Error submitting request:', error);
      setError(error.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-4">
        <Card className="mx-auto max-w-md w-full bg-[#121212] border-gray-800 text-white">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex justify-center">
              <div className="rounded-full bg-green-900/20 p-3 text-green-400">
                <Check className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-2xl">Request Submitted</CardTitle>
            <CardDescription className="text-gray-400">
              Thank you for your interest in Duval Asphalt
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">
              Our team will review your information and contact you shortly to discuss your account setup and credit options.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push('/')} className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black">
              Back to Homepage
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <Card className="mx-auto max-w-md w-full bg-[#121212] border-gray-800 text-white">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4">
            <span className="text-2xl font-bold text-[#EFCD00]">Duval Asphalt</span>
          </div>
          <CardTitle className="text-2xl">Request an Account</CardTitle>
          <CardDescription className="text-gray-400">
            Submit your information to be contacted about setting up an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center space-x-2 rounded-md bg-red-900/20 p-3 text-red-400 border border-red-800">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-gray-300">First Name*</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-gray-300">Last Name*</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email*</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="bg-[#1a1a1a] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company" className="text-gray-300">Company Name*</Label>
              <Input
                id="company"
                name="company"
                required
                value={formData.company}
                onChange={handleChange}
                className="bg-[#1a1a1a] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-300">Phone Number*</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className="bg-[#1a1a1a] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-gray-300">Additional Information</Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                className="bg-[#1a1a1a] border-gray-700 text-white min-h-[100px]"
                placeholder="Tell us about your needs and estimated asphalt volume"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black"
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center">
          <div>
            <span className="text-gray-400">Already have an account? </span>
            <Link href="/login" className="text-[#EFCD00] hover:underline">
              Login
            </Link>
          </div>
          <Link href="/" className="text-sm text-gray-400 hover:text-[#EFCD00]">
            Back to Homepage
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
} 