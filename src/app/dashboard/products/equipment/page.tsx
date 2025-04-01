'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
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
  Edit,
  Loader2,
  MoreHorizontal,
  PlusCircle,
  Search,
  Wrench,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

// Product type definition
interface EquipmentProduct {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  category: string;
  isActive: boolean;
  price: number;
  imageUrl?: string;
  partNumber?: string;
  manufacturer?: string;
  inStock?: number;
  createdAt: any;
  updatedAt: any;
}

// Initial empty product form state
const initialProductState = {
  name: '',
  description: '',
  shortDescription: '',
  category: 'Equipment',
  isActive: true,
  price: 0,
  imageUrl: '',
  partNumber: '',
  manufacturer: '',
  inStock: 0
};

export default function EquipmentProductsPage() {
  const [products, setProducts] = useState<EquipmentProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<EquipmentProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [productForm, setProductForm] = useState(initialProductState);
  const [currentProduct, setCurrentProduct] = useState<EquipmentProduct | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [categories, setCategories] = useState<string[]>([]);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userData } = useAuthContext();

  // Check for action param to auto-open add dialog
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'add') {
      setShowAddDialog(true);
    }
  }, [searchParams]);

  // Redirect if user doesn't have admin role
  useEffect(() => {
    if (userData && userData.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [userData, router]);

  // Fetch products from Firestore
  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true);
        const productsCollection = collection(db, 'products');
        const productsSnapshot = await getDocs(productsCollection);
        const productsList = productsSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          } as EquipmentProduct))
          .filter(product => 
            product.category === 'Equipment' || 
            product.category === 'Parts' || 
            product.category === 'Hardware'
          )
          .sort((a, b) => a.name.localeCompare(b.name));
        
        setProducts(productsList);
        setFilteredProducts(productsList);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(productsList.map(p => p.category))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Filter products based on active tab, category and search query
  useEffect(() => {
    let filtered = [...products];
    
    // Apply status filter
    if (activeTab === 'active') {
      filtered = filtered.filter(product => product.isActive);
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter(product => !product.isActive);
    }
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.description?.toLowerCase().includes(query) ||
        product.shortDescription?.toLowerCase().includes(query) ||
        product.partNumber?.toLowerCase().includes(query) ||
        product.manufacturer?.toLowerCase().includes(query)
      );
    }
    
    setFilteredProducts(filtered);
  }, [activeTab, selectedCategory, searchQuery, products]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setProductForm({
        ...productForm,
        [name]: value === '' ? 0 : parseFloat(value)
      });
    } else {
      setProductForm({
        ...productForm,
        [name]: value
      });
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setProductForm({
      ...productForm,
      [name]: checked
    });
  };

  // Validate form
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!productForm.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!productForm.shortDescription.trim()) {
      newErrors.shortDescription = 'Short description is required';
    }
    
    if (!productForm.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (productForm.price < 0) {
      newErrors.price = 'Price cannot be negative';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add new product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSaving(true);
    
    try {
      const productData = {
        ...productForm,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'products'), productData);
      
      // Add to state with the new ID
      const newProduct = { 
        id: docRef.id, 
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as EquipmentProduct;
      
      setProducts([...products, newProduct]);
      
      toast.success('Product added successfully');
      setShowAddDialog(false);
      setProductForm(initialProductState);
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    } finally {
      setIsSaving(false);
    }
  };

  // Edit product
  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !currentProduct) return;
    
    setIsSaving(true);
    
    try {
      const productRef = doc(db, 'products', currentProduct.id);
      
      await updateDoc(productRef, {
        ...productForm,
        updatedAt: serverTimestamp()
      });
      
      // Update in state
      const updatedProducts = products.map(product => 
        product.id === currentProduct.id 
          ? { 
              ...product, 
              ...productForm, 
              updatedAt: new Date() 
            } 
          : product
      );
      
      setProducts(updatedProducts);
      
      toast.success('Product updated successfully');
      setShowEditDialog(false);
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async () => {
    if (!currentProduct) return;
    
    try {
      await deleteDoc(doc(db, 'products', currentProduct.id));
      
      // Remove from state
      setProducts(products.filter(product => product.id !== currentProduct.id));
      
      toast.success('Product deleted successfully');
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  // Open edit dialog with product data
  const openEditDialog = (product: EquipmentProduct) => {
    setCurrentProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      shortDescription: product.shortDescription,
      category: product.category,
      isActive: product.isActive,
      price: product.price,
      imageUrl: product.imageUrl || '',
      partNumber: product.partNumber || '',
      manufacturer: product.manufacturer || '',
      inStock: product.inStock || 0
    });
    setShowEditDialog(true);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (product: EquipmentProduct) => {
    setCurrentProduct(product);
    setShowDeleteDialog(true);
  };

  // Reset form
  const resetForm = () => {
    setProductForm(initialProductState);
    setErrors({});
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Product form component
  const ProductForm = ({ onSubmit }: { onSubmit: (e: React.FormEvent) => Promise<void> }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-gray-300">Product Name *</Label>
        <Input
          id="name"
          name="name"
          value={productForm.name}
          onChange={handleInputChange}
          className="bg-[#1a1a1a] border-gray-700 text-white"
          placeholder="Bitumen Transfer Pump"
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="shortDescription" className="text-gray-300">Short Description *</Label>
        <Input
          id="shortDescription"
          name="shortDescription"
          value={productForm.shortDescription}
          onChange={handleInputChange}
          className="bg-[#1a1a1a] border-gray-700 text-white"
          placeholder="A brief description of the product"
        />
        {errors.shortDescription && <p className="text-red-500 text-sm">{errors.shortDescription}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-gray-300">Full Description *</Label>
        <Textarea
          id="description"
          name="description"
          value={productForm.description}
          onChange={handleInputChange}
          className="bg-[#1a1a1a] border-gray-700 text-white h-24"
          placeholder="Detailed information about the product"
        />
        {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category" className="text-gray-300">Category</Label>
          <select
            id="category"
            name="category"
            value={productForm.category}
            onChange={e => handleInputChange(e as any)}
            className="w-full bg-[#1a1a1a] border-gray-700 text-white rounded-md p-2"
          >
            <option value="Equipment">Equipment</option>
            <option value="Parts">Parts</option>
            <option value="Hardware">Hardware</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price" className="text-gray-300">Price</Label>
          <Input
            id="price"
            name="price"
            type="number"
            value={productForm.price.toString()}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            className="bg-[#1a1a1a] border-gray-700 text-white"
          />
          {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="partNumber" className="text-gray-300">Part Number</Label>
          <Input
            id="partNumber"
            name="partNumber"
            value={productForm.partNumber}
            onChange={handleInputChange}
            className="bg-[#1a1a1a] border-gray-700 text-white"
            placeholder="BP-2000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="manufacturer" className="text-gray-300">Manufacturer</Label>
          <Input
            id="manufacturer"
            name="manufacturer"
            value={productForm.manufacturer}
            onChange={handleInputChange}
            className="bg-[#1a1a1a] border-gray-700 text-white"
            placeholder="Acme Inc."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="inStock" className="text-gray-300">Stock Quantity</Label>
          <Input
            id="inStock"
            name="inStock"
            type="number"
            value={productForm.inStock.toString()}
            onChange={handleInputChange}
            min="0"
            className="bg-[#1a1a1a] border-gray-700 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl" className="text-gray-300">Image URL (Optional)</Label>
          <Input
            id="imageUrl"
            name="imageUrl"
            value={productForm.imageUrl}
            onChange={handleInputChange}
            className="bg-[#1a1a1a] border-gray-700 text-white"
            placeholder="https://example.com/image.jpg"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          className="rounded border-gray-700 bg-[#1a1a1a]"
          checked={productForm.isActive}
          onChange={handleCheckboxChange}
        />
        <Label htmlFor="isActive" className="text-gray-300">Active Product</Label>
      </div>
    </form>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Equipment & Parts</h1>
          <p className="text-white opacity-70">Manage your equipment, parts, and hardware catalog</p>
        </div>
        <Button onClick={() => {
          resetForm();
          setShowAddDialog(true);
        }} className="bg-[#EFCD00] hover:bg-[#EFCD00]/90 text-black">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <Card className="bg-[#121212] border-gray-800 text-white">
        <CardHeader>
          <CardTitle>Equipment Catalog</CardTitle>
          <CardDescription className="text-white opacity-70">
            Manage your equipment and parts inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
                <TabsList className="bg-[#1a1a1a] p-0.5">
                  <TabsTrigger value="all" className="px-4 py-2">All Items</TabsTrigger>
                  <TabsTrigger value="active" className="px-4 py-2">Active</TabsTrigger>
                  <TabsTrigger value="inactive" className="px-4 py-2">Inactive</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {categories.length > 0 && (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-[#1a1a1a] border border-gray-700 text-white rounded-md px-3 py-1 h-[36px]"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              )}
            </div>
            
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-[#1a1a1a] border-gray-700 text-white w-full md:w-[300px]"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 text-[#EFCD00] animate-spin" />
              <span className="ml-2">Loading products...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-gray-700 rounded-lg">
              <Wrench className="h-12 w-12 text-gray-500 mb-4" />
              <h3 className="text-lg text-gray-300 mb-2">No Products Found</h3>
              <p className="text-gray-400 text-center max-w-md mb-4">
                {searchQuery 
                  ? "No products match your search criteria." 
                  : activeTab !== 'all' 
                    ? `No ${activeTab} products found.` 
                    : selectedCategory !== 'all'
                      ? `No ${selectedCategory} products found.`
                      : "You haven't added any equipment or parts yet."}
              </p>
              {!searchQuery && activeTab === 'all' && selectedCategory === 'all' && (
                <Button onClick={() => {
                  resetForm();
                  setShowAddDialog(true);
                }} className="bg-[#EFCD00] hover:bg-[#EFCD00]/90 text-black">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Your First Product
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-white/20 overflow-hidden">
              <Table>
                <TableHeader className="bg-[#1a1a1a]">
                  <TableRow>
                    <TableHead className="text-white">Product Name</TableHead>
                    <TableHead className="text-white">Description</TableHead>
                    <TableHead className="text-white">Category</TableHead>
                    <TableHead className="text-white">Part #</TableHead>
                    <TableHead className="text-white">Price</TableHead>
                    <TableHead className="text-white">Stock</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id} className="border-t border-white/10">
                      <TableCell className="font-medium text-white">{product.name}</TableCell>
                      <TableCell className="text-white opacity-80 max-w-[200px] truncate">
                        {product.shortDescription}
                      </TableCell>
                      <TableCell className="text-white opacity-80">{product.category}</TableCell>
                      <TableCell className="text-white opacity-80">{product.partNumber || '-'}</TableCell>
                      <TableCell className="text-white opacity-80">{formatPrice(product.price)}</TableCell>
                      <TableCell className="text-white opacity-80">{product.inStock || 0}</TableCell>
                      <TableCell>
                        {product.isActive ? (
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
                              onClick={() => openEditDialog(product)}
                              className="hover:bg-white/10 cursor-pointer"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(product)}
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

      {/* Add Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-[#121212] border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription className="text-white opacity-70">
              Add a new equipment item or part to your catalog
            </DialogDescription>
          </DialogHeader>
          <ProductForm onSubmit={handleAddProduct} />
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAddDialog(false)}
              className="border-white/30 text-white hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddProduct}
              disabled={isSaving}
              className="bg-[#EFCD00] hover:bg-[#EFCD00]/90 text-black"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Adding...' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-[#121212] border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription className="text-white opacity-70">
              Update the details of this product
            </DialogDescription>
          </DialogHeader>
          <ProductForm onSubmit={handleEditProduct} />
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEditDialog(false)}
              className="border-white/30 text-white hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditProduct}
              disabled={isSaving}
              className="bg-[#EFCD00] hover:bg-[#EFCD00]/90 text-black"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-[#121212] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription className="text-white opacity-70">
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {currentProduct && (
            <div className="py-4">
              <p className="text-white mb-2">
                <span className="font-semibold">Product:</span> {currentProduct.name}
              </p>
              <p className="text-white mb-2">
                <span className="font-semibold">Description:</span> {currentProduct.shortDescription}
              </p>
              <p className="text-white mb-2">
                <span className="font-semibold">Category:</span> {currentProduct.category}
              </p>
              <p className="text-white mb-2">
                <span className="font-semibold">Price:</span> {formatPrice(currentProduct.price)}
              </p>
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
              onClick={handleDeleteProduct}
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