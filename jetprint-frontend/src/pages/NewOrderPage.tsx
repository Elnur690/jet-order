import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { PaperType, type Branch } from '../types';
import Header from '../components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Trash2, Upload, AlertCircle, Loader2 } from 'lucide-react';

type ProductFormData = {
  name: string;
  width: number;
  height: number;
  quantity: number;
  price: number;
  needsDesign: boolean;
  designAmount: number;
  needsCut: boolean;
  needsLamination: boolean;
  paperType: PaperType;
  files: File[];
};

const NewOrderPage = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Order fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [branchId, setBranchId] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [notes, setNotes] = useState('');
  const [products, setProducts] = useState<ProductFormData[]>([
    {
      name: '',
      width: 0,
      height: 0,
      quantity: 1,
      price: 0,
      needsDesign: false,
      designAmount: 0,
      needsCut: false,
      needsLamination: false,
      paperType: PaperType.GLOSS,
      files: [],
    },
  ]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await api.get<Branch[]>('/branches');
        setBranches(response.data);
        if (response.data.length > 0) setBranchId(response.data[0].id);
      } catch (err) {
        setError('Could not load branches.');
      }
    };
    fetchBranches();
  }, []);

  const addProduct = () => {
    setProducts([
      ...products,
      {
        name: '',
        width: 0,
        height: 0,
        quantity: 1,
        price: 0,
        needsDesign: false,
        designAmount: 0,
        needsCut: false,
        needsLamination: false,
        paperType: PaperType.GLOSS,
        files: [],
      },
    ]);
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, field: string, value: any) => {
    const newProducts = [...products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setProducts(newProducts);
  };

  const handleFileChange = (index: number, files: FileList | null) => {
    if (!files) return;
    const newProducts = [...products];
    newProducts[index].files = Array.from(files);
    setProducts(newProducts);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData();
    formData.append('customerName', customerName);
    formData.append('customerPhone', customerPhone);
    formData.append('branchId', branchId);
    formData.append('isUrgent', String(isUrgent));
    formData.append('notes', notes);

    const productMetadata = products.map((p) => {
      const { files, ...meta } = p;
      return meta;
    });
    formData.append('products', JSON.stringify(productMetadata));

    products.forEach((product, productIndex) => {
      product.files.forEach((file) => {
        formData.append(`productFiles[${productIndex}]`, file);
      });
    });

    try {
      await api.post('/orders', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate('/orders');
    } catch (err) {
      setError('Failed to create order. Please check all fields.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <main className="container mx-auto p-4 md:p-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Create New Order</h1>
          <p className="text-slate-600">Fill in the order details and add products</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Enter customer details for this order</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    placeholder="1234567890"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name (Optional)</Label>
                  <Input
                    id="customerName"
                    placeholder="John Doe"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branch">
                    Branch Location <span className="text-red-500">*</span>
                  </Label>
                  <Select value={branchId} onValueChange={setBranchId} required>
                    <SelectTrigger id="branch">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isUrgent}
                      onChange={(e) => setIsUrgent(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <span className="text-sm font-medium">Mark as Urgent</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Products ({products.length})
                  </CardTitle>
                  <CardDescription>Add products to this order</CardDescription>
                </div>
                <Button type="button" onClick={addProduct} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {products.map((product, index) => (
                <Card key={index} className="border-2 border-slate-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Product #{index + 1}</Badge>
                      {products.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProduct(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Product Name</Label>
                        <Input
                          placeholder="Business Cards"
                          value={product.name}
                          onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Paper Type</Label>
                        <Select
                          value={product.paperType}
                          onValueChange={(value) => handleProductChange(index, 'paperType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(PaperType).map((pt) => (
                              <SelectItem key={pt} value={pt}>
                                {pt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Dimensions & Quantity */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Width (cm)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="8.5"
                          value={product.width || ''}
                          onChange={(e) => handleProductChange(index, 'width', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Height (cm)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="5.5"
                          value={product.height || ''}
                          onChange={(e) => handleProductChange(index, 'height', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Quantity <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={product.quantity || ''}
                          onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Price ($) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="50.00"
                          value={product.price || ''}
                          onChange={(e) => handleProductChange(index, 'price', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Options */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Additional Options</Label>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={product.needsDesign}
                            onChange={(e) => handleProductChange(index, 'needsDesign', e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          <span className="text-sm">Needs Design</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={product.needsCut}
                            onChange={(e) => handleProductChange(index, 'needsCut', e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          <span className="text-sm">Special Cut</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={product.needsLamination}
                            onChange={(e) => handleProductChange(index, 'needsLamination', e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          <span className="text-sm">Lamination</span>
                        </label>
                      </div>

                      {product.needsDesign && (
                        <div className="space-y-2 max-w-xs">
                          <Label>Design Amount ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="25.00"
                            value={product.designAmount || ''}
                            onChange={(e) => handleProductChange(index, 'designAmount', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* File Upload */}
                    <div className="space-y-2">
                      <Label>Upload Files</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          multiple
                          onChange={(e) => handleFileChange(index, e.target.files)}
                          className="cursor-pointer"
                        />
                        {product.files.length > 0 && (
                          <Badge variant="secondary">
                            {product.files.length} file{product.files.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Order Notes</CardTitle>
              <CardDescription>Add any special instructions or notes</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full min-h-[100px] p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Special instructions, delivery notes, etc..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-900">
                  <AlertCircle className="h-5 w-5" />
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/orders')}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 min-w-[150px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Order
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default NewOrderPage;
