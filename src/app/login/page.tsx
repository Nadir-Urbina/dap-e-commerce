'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if user has admin or staff role
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      if (!userData || (userData.role !== 'admin' && userData.role !== 'staff')) {
        // Sign out if not admin/staff
        await auth.signOut();
        setError('You do not have permission to access the admin dashboard.');
        setIsLoading(false);
        return;
      }

      // Redirect to dashboard for admin/staff
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid email or password. Please try again.');
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <Card className="mx-auto max-w-md w-full bg-[#121212] border-gray-800 text-white">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4">
            <span className="text-2xl font-bold text-[#EFCD00]">Duval Asphalt</span>
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center space-x-2 rounded-md bg-red-900/20 p-3 text-red-400 border border-red-800">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#1a1a1a] border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#1a1a1a] border-gray-700 text-white pr-10"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-[#EFCD00]">
            Back to Homepage
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
} 