import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { type Order } from '../types';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Phone, 
  MapPin, 
  Calendar, 
  Package, 
  FileText, 
  MessageSquare, 
  Copy, 
  ExternalLink,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Truck
} from 'lucide-react';

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useWebSocket();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [shippingPrice, setShippingPrice] = useState<string>('');
  const [showShippingForm, setShowShippingForm] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await api.get<Order>(`/orders/${id}`);
      setOrder(response.data);
    } catch (err) {
      setError('Failed to fetch order details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // Real-time updates via WebSocket
  useEffect(() => {
    if (!socket || !id) return;
    const handleOrderUpdate = (data: any) => {
      if (data.orderId === id) fetchOrder();
    };
    socket.on('orderUpdate', handleOrderUpdate);
    return () => { socket.off('orderUpdate', handleOrderUpdate); };
  }, [socket, id, fetchOrder]);

  const handleClaimStage = async () => {
    try {
      await api.post('/stage-claims', { orderId: id });
      alert('Order claimed successfully!');
      fetchOrder();
    } catch (err) { alert('Failed to claim order.'); }
  };

  const handleAdvanceStage = async (claimId: string) => {
    try {
      await api.patch(`/stage-claims/${claimId}/advance`);
      alert('Order advanced to the next stage!');
      navigate('/orders');
    } catch (err) { alert('Failed to advance stage.'); }
  };

  const handleGenerateConfirmation = async () => {
    try {
      const response = await api.get(`/orders/${id}/confirmation-message`);
      setConfirmationMessage(response.data);
      setShowConfirmation(true);
    } catch (err) {
      alert('Failed to generate confirmation message.');
    }
  };

  const handleCopyConfirmation = () => {
    navigator.clipboard.writeText(confirmationMessage);
    alert('Confirmation message copied to clipboard!');
  };

  const handleUpdateShipping = async () => {
    try {
      await api.patch(`/orders/${id}/shipping`, { shippingPrice: parseFloat(shippingPrice) });
      alert('Shipping price updated successfully!');
      setShowShippingForm(false);
      setShippingPrice('');
      fetchOrder();
    } catch (err) {
      alert('Failed to update shipping price.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header />
        <main className="container mx-auto p-4 md:p-8">
          <Skeleton className="h-12 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-96" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header />
        <main className="container mx-auto p-4 md:p-8">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">{error || 'Order not found'}</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const activeClaim = order.stageClaims.find(c => c.completedAt === null) || null;
  const isClaimedByMe = activeClaim?.user.id === user?.id;
  const canBeClaimed = !activeClaim;

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      WAITING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      DESIGN: 'bg-purple-100 text-purple-800 border-purple-200',
      PRINT_READY: 'bg-blue-100 text-blue-800 border-blue-200',
      PRINTING: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      CUT: 'bg-pink-100 text-pink-800 border-pink-200',
      COMPLETED: 'bg-green-100 text-green-800 border-green-200',
      DELIVERED: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[stage] || 'bg-slate-100 text-slate-800';
  };

  const calculateTotals = () => {
    let productTotal = 0;
    let designTotal = 0;
    order.products.forEach(p => {
      productTotal += Number(p.price);
      if (p.needsDesign) designTotal += Number(p.designAmount || 0);
    });
    const shipping = Number(order.shippingPrice || 0);
    return {
      products: productTotal,
      design: designTotal,
      shipping,
      total: productTotal + designTotal + shipping
    };
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        {/* Header Section */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/orders" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Link>
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Order #{order.id.substring(0, 8).toUpperCase()}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${getStageColor(order.currentStage)} border px-3 py-1`}>
                  {order.currentStage.replace('_', ' ')}
                </Badge>
                {order.isUrgent && (
                  <Badge variant="destructive" className="animate-pulse">
                    URGENT
                  </Badge>
                )}
                {activeClaim && (
                  <Badge variant="outline">
                    {isClaimedByMe ? '🔒 Claimed by you' : '🔒 Claimed'}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleGenerateConfirmation} className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Generate Confirmation
              </Button>
              {canBeClaimed && (
                <Button onClick={handleClaimStage} className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Claim Order
                </Button>
              )}
              {isClaimedByMe && activeClaim && (
                <Button onClick={() => handleAdvanceStage(activeClaim.id)} className="gap-2 bg-green-600 hover:bg-green-700">
                  <TrendingUp className="h-4 w-4" />
                  Send to Next Stage
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-blue-600" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-600">Phone Number</Label>
                  <p className="text-lg font-semibold mt-1">{order.customerPhone}</p>
                </div>
                {order.customerName && (
                  <div>
                    <Label className="text-slate-600">Name</Label>
                    <p className="text-lg font-semibold mt-1">{order.customerName}</p>
                  </div>
                )}
                <div>
                  <Label className="text-slate-600">Branch Location</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <p className="font-semibold">{order.branch.name}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-600">Order Date</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <p className="font-semibold">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-purple-600" />
                  Products ({order.products.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.products.map((product, index) => (
                  <Card key={product.id} className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {product.name || `Product #${index + 1}`}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs text-slate-600">Size</Label>
                          <p className="font-semibold">{product.width} × {product.height} cm</p>
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Quantity</Label>
                          <p className="font-semibold">{product.quantity}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Paper Type</Label>
                          <p className="font-semibold">{product.paperType}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Price</Label>
                          <p className="font-semibold text-green-600">${Number(product.price).toFixed(2)}</p>
                        </div>
                        {product.needsDesign && (
                          <div>
                            <Label className="text-xs text-slate-600">Design Amount</Label>
                            <p className="font-semibold text-purple-600">${Number(product.designAmount).toFixed(2)}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {product.needsDesign && <Badge variant="secondary">Design Required</Badge>}
                        {product.needsCut && <Badge variant="secondary">Special Cut</Badge>}
                        {product.needsLamination && <Badge variant="secondary">Lamination</Badge>}
                      </div>

                      {product.files && product.files.length > 0 && (
                        <div className="pt-3 border-t">
                          <Label className="text-xs text-slate-600 mb-2 block">Attached Files</Label>
                          <div className="flex flex-wrap gap-2">
                            {product.files.map(file => (
                              <Button
                                key={file.id}
                                variant="outline"
                                size="sm"
                                asChild
                                className="gap-2"
                              >
                                <a href={file.url} target="_blank" rel="noreferrer">
                                  <FileText className="h-3 w-3" />
                                  {file.fileName}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Notes */}
            {order.notes && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    Order Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-md border">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="shadow-lg border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Products Total</span>
                  <span className="font-semibold">${totals.products.toFixed(2)}</span>
                </div>
                {totals.design > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Design Work</span>
                    <span className="font-semibold text-purple-600">${totals.design.toFixed(2)}</span>
                  </div>
                )}
                {totals.shipping > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Shipping</span>
                    <span className="font-semibold">${totals.shipping.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Grand Total</span>
                  <span className="font-bold text-green-600">${totals.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Shipping */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  Shipping
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.shippingPrice ? (
                  <div>
                    <p className="text-2xl font-bold text-green-600 mb-2">${Number(order.shippingPrice).toFixed(2)}</p>
                    <Button variant="outline" size="sm" onClick={() => setShowShippingForm(!showShippingForm)}>
                      Update Price
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => setShowShippingForm(!showShippingForm)} className="w-full">
                    Add Shipping Price
                  </Button>
                )}
                {showShippingForm && (
                  <div className="mt-3 space-y-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={shippingPrice}
                      onChange={(e) => setShippingPrice(e.target.value)}
                      placeholder="0.00"
                    />
                    <Button onClick={handleUpdateShipping} className="w-full">
                      Save Shipping Price
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-indigo-600" />
                  Order History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.stageClaims.length === 0 ? (
                    <p className="text-sm text-slate-500">No history yet</p>
                  ) : (
                    order.stageClaims.map((claim, index) => (
                      <div key={claim.id} className="relative pl-6 pb-4 border-l-2 border-slate-200 last:border-0">
                        <div className={`absolute -left-2 top-0 w-4 h-4 rounded-full border-2 border-white ${claim.completedAt ? 'bg-green-500' : 'bg-blue-500'}`} />
                        <div>
                          <Badge variant="outline" className="mb-1">{claim.stage.replace('_', ' ')}</Badge>
                          <p className="text-sm font-medium">{claim.user.phone}</p>
                          <p className="text-xs text-slate-500">{new Date(claim.claimedAt).toLocaleString()}</p>
                          {claim.completedAt && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Completed {new Date(claim.completedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Confirmation Message</DialogTitle>
              <DialogDescription>
                Copy this message to send to your customer via WhatsApp, Telegram, or Messenger
              </DialogDescription>
            </DialogHeader>
            <pre className="bg-slate-50 p-4 rounded-md border text-sm whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
              {confirmationMessage}
            </pre>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleCopyConfirmation} className="gap-2">
                <Copy className="h-4 w-4" />
                Copy to Clipboard
              </Button>
              <Button asChild className="gap-2 bg-green-600 hover:bg-green-700">
                <a 
                  href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(confirmationMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageSquare className="h-4 w-4" />
                  Send via WhatsApp
                </a>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default OrderDetailPage;
