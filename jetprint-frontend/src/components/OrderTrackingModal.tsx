import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Search, Loader2, Package, Phone, MapPin, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { type Order } from '../types';

interface OrderTrackingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OrderTrackingModal = ({ open, onOpenChange }: OrderTrackingModalProps) => {
  const [searchType, setSearchType] = useState<'orderId' | 'phone'>('orderId');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setError('Please enter a search value');
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      if (searchType === 'orderId') {
        const response = await api.get<Order>(`/orders/${searchValue}`);
        setOrder(response.data);
      } else {
        // Search by phone - get all orders and filter
        const response = await api.get<Order[]>('/orders');
        const found = response.data.find(o => o.customerPhone === searchValue);
        if (found) {
          const detailResponse = await api.get<Order>(`/orders/${found.id}`);
          setOrder(detailResponse.data);
        } else {
          setError('No order found with this phone number');
        }
      }
    } catch (err) {
      setError('Order not found. Please check your search criteria.');
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      WAITING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      DESIGN: 'bg-purple-100 text-purple-800 border-purple-300',
      PRINT_READY: 'bg-blue-100 text-blue-800 border-blue-300',
      PRINTING: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      CUT: 'bg-pink-100 text-pink-800 border-pink-300',
      COMPLETED: 'bg-green-100 text-green-800 border-green-300',
      DELIVERED: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[stage] || 'bg-slate-100 text-slate-800';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Track Your Order</DialogTitle>
          <DialogDescription>
            Search for an order using the order ID or customer phone number
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Controls */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={searchType === 'orderId' ? 'default' : 'outline'}
                onClick={() => setSearchType('orderId')}
                className="flex-1"
              >
                Order ID
              </Button>
              <Button
                type="button"
                variant={searchType === 'phone' ? 'default' : 'outline'}
                onClick={() => setSearchType('phone')}
                className="flex-1"
              >
                Phone Number
              </Button>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="search">
                  {searchType === 'orderId' ? 'Enter Order ID' : 'Enter Phone Number'}
                </Label>
                <Input
                  id="search"
                  placeholder={searchType === 'orderId' ? 'e.g., ABC12345' : 'e.g., 1234567890'}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="mt-auto gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search
              </Button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <p className="text-red-800 text-sm">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Order Details */}
          {order && (
            <div className="space-y-6">
              <Separator />

              {/* Header Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Order #{order.id.substring(0, 8).toUpperCase()}</h3>
                  <Badge className={`${getStageColor(order.currentStage)} border text-sm px-3 py-1`}>
                    {order.currentStage.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{order.customerPhone}</span>
                  </div>
                  {order.customerName && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{order.customerName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{order.branch.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Timeline */}
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Order Progress
                </h4>
                <div className="space-y-3">
                  {order.stageClaims.length === 0 ? (
                    <p className="text-sm text-gray-500">No progress updates yet</p>
                  ) : (
                    order.stageClaims.map((claim) => (
                      <div
                        key={claim.id}
                        className="flex gap-3 items-start pb-3 border-l-2 border-gray-200 pl-4 last:border-0"
                      >
                        <div className={`mt-1 rounded-full p-1 ${claim.completedAt ? 'bg-green-500' : 'bg-blue-500'}`}>
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {claim.stage.replace('_', ' ')}
                            </Badge>
                            {claim.completedAt && (
                              <span className="text-xs text-green-600 font-medium">
                                ✓ Completed
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Started: {new Date(claim.claimedAt).toLocaleString()}
                          </p>
                          {claim.completedAt && (
                            <p className="text-xs text-gray-500">
                              Finished: {new Date(claim.completedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Separator />

              {/* Products Summary */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Products ({order.products.length})
                </h4>
                <div className="space-y-2">
                  {order.products.map((product, idx) => (
                    <div key={product.id} className="text-sm p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium">{product.name || `Product #${idx + 1}`}</div>
                      <div className="text-gray-600 text-xs mt-1">
                        {product.quantity} × {product.width} × {product.height} cm - ${Number(product.price).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderTrackingModal;

