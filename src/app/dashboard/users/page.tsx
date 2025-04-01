'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, MoreHorizontal, UserPlus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthContext } from '@/components/auth-provider';
import { toast } from 'sonner';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const router = useRouter();
  const { userData } = useAuthContext();

  // Redirect if not admin
  useEffect(() => {
    if (userData && userData.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [userData, router]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const usersCollection = collection(db, 'users');
        const usersQuery = query(usersCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(usersQuery);
        
        const usersData = querySnapshot.docs.map(doc => {
          const data = doc.data() as User;
          return { ...data, id: doc.id };
        });
        
        setUsers(usersData);
        setFilteredUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search and role selection
  useEffect(() => {
    let result = users;
    
    // Apply search filter
    if (searchQuery) {
      const lowerSearch = searchQuery.toLowerCase();
      result = result.filter(user => 
        user.email.toLowerCase().includes(lowerSearch) ||
        user.firstName.toLowerCase().includes(lowerSearch) ||
        user.lastName.toLowerCase().includes(lowerSearch) ||
        user.company.toLowerCase().includes(lowerSearch)
      );
    }
    
    // Apply role filter
    if (selectedRole !== 'all') {
      result = result.filter(user => user.role === selectedRole);
    }
    
    setFilteredUsers(result);
  }, [searchQuery, selectedRole, users]);

  const handleAddUser = () => {
    router.push('/dashboard/users/new');
  };

  const handleEditUser = (userId: string) => {
    router.push(`/dashboard/users/${userId}`);
  };

  const confirmDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'users', userToDelete.uid));
      setUsers(users.filter(user => user.uid !== userToDelete.uid));
      toast.success('User deleted successfully');
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  // Render role badge with appropriate color
  const RoleBadge = ({ role }: { role: string }) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500 hover:bg-red-600">Admin</Badge>;
      case 'staff':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Staff</Badge>;
      case 'customer':
        return <Badge className="bg-green-500 hover:bg-green-600">Customer</Badge>;
      default:
        return <Badge className="bg-gray-500">{role}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-white opacity-70">Manage user accounts and permissions</p>
        </div>
        <Button onClick={handleAddUser} className="bg-[#EFCD00] hover:bg-[#EFCD00]/90 text-black">
          <UserPlus className="h-4 w-4 mr-2" /> Add User
        </Button>
      </div>

      <Card className="bg-[#121212] border-gray-800 text-white">
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription className="text-white opacity-70">
            View and manage all system users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-[#1a1a1a] border-gray-700 text-white w-full"
                />
              </div>
              <Tabs defaultValue={selectedRole} onValueChange={setSelectedRole}>
                <TabsList className="bg-[#1a1a1a] p-0.5">
                  <TabsTrigger value="all" className="px-4 py-2">All</TabsTrigger>
                  <TabsTrigger value="admin" className="px-4 py-2">Admins</TabsTrigger>
                  <TabsTrigger value="staff" className="px-4 py-2">Staff</TabsTrigger>
                  <TabsTrigger value="customer" className="px-4 py-2">Customers</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="rounded-md border border-white/20 overflow-hidden">
              <Table>
                <TableHeader className="bg-[#1a1a1a]">
                  <TableRow>
                    <TableHead className="text-white w-[250px]">Name</TableHead>
                    <TableHead className="text-white">Email</TableHead>
                    <TableHead className="text-white">Company</TableHead>
                    <TableHead className="text-white">Role</TableHead>
                    <TableHead className="text-white">Location</TableHead>
                    <TableHead className="text-white text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-white opacity-70">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-white opacity-70">
                        {searchQuery ? 'No users match your search' : 'No users found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.uid} className="border-t border-white/10">
                        <TableCell className="font-medium text-white">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell className="text-white opacity-80">{user.email}</TableCell>
                        <TableCell className="text-white opacity-80">{user.company || '-'}</TableCell>
                        <TableCell>
                          <RoleBadge role={user.role} />
                        </TableCell>
                        <TableCell className="text-white opacity-80">
                          {user.locationId || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-white">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-gray-700 text-white">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-gray-700" />
                              <DropdownMenuItem 
                                onClick={() => handleEditUser(user.uid)}
                                className="hover:bg-white/10 cursor-pointer"
                              >
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => confirmDelete(user)}
                                className="text-red-400 hover:bg-red-900/20 hover:text-red-400 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#121212] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription className="text-white opacity-70">
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {userToDelete && (
            <div className="py-4">
              <p className="text-white mb-2">
                <span className="font-semibold">Name:</span> {userToDelete.firstName} {userToDelete.lastName}
              </p>
              <p className="text-white mb-2">
                <span className="font-semibold">Email:</span> {userToDelete.email}
              </p>
              <p className="text-white">
                <span className="font-semibold">Role:</span> {userToDelete.role}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              className="border-white/30 text-white hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser}
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