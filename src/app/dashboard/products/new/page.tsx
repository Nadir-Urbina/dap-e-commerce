'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ProductType, ProductUnit } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Trash } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'asphalt_mix' as ProductType,
    description: '',
    specs: {
      odotApproved: false,
      specNumber: '',
      maxAggregateSize: undefined as number | undefined,
    },
    pricePerUnit: 0,
    unit: 'ton' as ProductUnit,
    minOrderQuantity: 1,
    imageUrl: '',
    tags: [] as string[],
    isAvailable: true,
  });
  
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSpecsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData({
        ...formData,
        specs: {
          ...formData.specs,
          [name]: value === '' ? undefined : Number(value),
        },
      });
    } else {
      setFormData({
        ...formData,
        specs: {
          ...formData.specs,
          [name]: value,
        },
      });
    }
  };

  const handleSwitchChange = (checked: boolean, name: string) => {
    if (name === 'odotApproved') {
      setFormData({
        ...formData,
        specs: {
          ...formData.specs,
          odotApproved: checked,
        },
      });
    } else {
      setFormData({ ...formData, [name]: checked });
    }
  };

  const handleSelectChange = (value: string, name: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleAddTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Add timestamps
      const productData = {
        ...formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      // Add document to Firestore
      await addDoc(collection(db, 'products'), productData);
      
      toast({
        title: "Product created",
        description: "Your product has been successfully added to the catalog.",
      });
      
      // Redirect to products list
      router.push('/dashboard/products');
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error creating product",
        description: "There was an error creating your product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="outline" 
          className="border-gray-700 text-white"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-[#EFCD00] ml-4">Add New Product</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-[#121212] border-gray-800 text-white">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., HMA SP-12.5"
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Product Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => handleSelectChange(value, 'type')}
                >
                  <SelectTrigger className="bg-[#1a1a1a] border-gray-700 text-white">
                    <SelectValue placeholder="Select product type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-700 text-white">
                    <SelectItem value="asphalt_mix">Asphalt Mix</SelectItem>
                    <SelectItem value="secondary">Secondary Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the product, its uses, and other relevant details"
                  className="min-h-[120px] bg-[#1a1a1a] border-gray-700 text-white"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tags (e.g., coarse, fine, polymer)"
                    className="bg-[#1a1a1a] border-gray-700 text-white"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="border-gray-700 text-white"
                    onClick={handleAddTag}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map(tag => (
                    <div 
                      key={tag} 
                      className="px-2 py-1 rounded-md bg-[#1a1a1a] border border-gray-700 text-white flex items-center"
                    >
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 ml-1 text-gray-400 hover:text-white"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pt-4">
                <Switch 
                  id="isAvailable" 
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) => handleSwitchChange(checked, 'isAvailable')}
                />
                <Label htmlFor="isAvailable">Available for Orders</Label>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#121212] border-gray-800 text-white">
            <CardHeader>
              <CardTitle>Pricing & Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricePerUnit">Price per Unit</Label>
                  <Input
                    id="pricePerUnit"
                    name="pricePerUnit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.pricePerUnit}
                    onChange={(e) => setFormData({ ...formData, pricePerUnit: parseFloat(e.target.value) })}
                    className="bg-[#1a1a1a] border-gray-700 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select 
                    value={formData.unit} 
                    onValueChange={(value) => handleSelectChange(value, 'unit')}
                  >
                    <SelectTrigger className="bg-[#1a1a1a] border-gray-700 text-white">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-gray-700 text-white">
                      <SelectItem value="ton">Ton</SelectItem>
                      <SelectItem value="each">Each</SelectItem>
                      <SelectItem value="gallon">Gallon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="minOrderQuantity">Minimum Order Quantity</Label>
                <Input
                  id="minOrderQuantity"
                  name="minOrderQuantity"
                  type="number"
                  min="1"
                  value={formData.minOrderQuantity}
                  onChange={(e) => setFormData({ ...formData, minOrderQuantity: parseInt(e.target.value) })}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  required
                />
              </div>
              
              <div className="pt-4 space-y-4">
                <h3 className="font-medium">Specifications</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="specNumber">Specification Number</Label>
                  <Input
                    id="specNumber"
                    name="specNumber"
                    value={formData.specs.specNumber}
                    onChange={handleSpecsChange}
                    placeholder="e.g., ODOT 448"
                    className="bg-[#1a1a1a] border-gray-700 text-white"
                  />
                </div>
                
                {formData.type === 'asphalt_mix' && (
                  <div className="space-y-2">
                    <Label htmlFor="maxAggregateSize">Maximum Aggregate Size (mm)</Label>
                    <Input
                      id="maxAggregateSize"
                      name="maxAggregateSize"
                      type="number"
                      min="0"
                      value={formData.specs.maxAggregateSize}
                      onChange={handleSpecsChange}
                      placeholder="e.g., 12.5"
                      className="bg-[#1a1a1a] border-gray-700 text-white"
                    />
                  </div>
                )}
                
                <div className="flex items-center space-x-2 pt-2">
                  <Switch 
                    id="odotApproved" 
                    checked={formData.specs.odotApproved}
                    onCheckedChange={(checked) => handleSwitchChange(checked, 'odotApproved')}
                  />
                  <Label htmlFor="odotApproved">ODOT Approved</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-6 flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            className="border-gray-700 text-white"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-[#EFCD00] text-black hover:bg-[#EFCD00]/90"
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Creating...' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  );
} 