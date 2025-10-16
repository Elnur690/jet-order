import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { type Order } from '../types';
import Header from '../components/Header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Phone, MapPin, Calendar, AlertCircle, Search, Filter } from 'lucide-react';

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<Order[]>('/orders');
      setOrders(response.data);
      setFilteredOrders(response.data);
    } catch (err) {
      setError('Failed to fetch orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    let filtered = orders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.customerPhone.includes(searchTerm) ||
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Stage filter
    if (stageFilter !== 'all') {
      filtered = filtered.filter(order => order.currentStage === stageFilter);
    }

    setFilteredOrders(filtered);
  }, [searchTerm, stageFilter, orders]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header />
        <main className="container mx-auto p-4 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="shadow-lg">
                <CardHeader>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error) {
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
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Available Orders</h1>
              <p className="text-slate-600">Orders in your assigned stages ready to claim</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-lg py-2 px-4">
                {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
              </Badge>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search by customer, phone, or order ID..."
                className="pl-10 bg-white shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-slate-400 h-4 w-4" />
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="bg-white shadow-sm">
                  <SelectValue placeholder="Filter by stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="WAITING">Waiting</SelectItem>
                  <SelectItem value="DESIGN">Design</SelectItem>
                  <SelectItem value="PRINT_READY">Print Ready</SelectItem>
                  <SelectItem value="PRINTING">Printing</SelectItem>
                  <SelectItem value="CUT">Cut</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No orders found</h3>
                <p className="text-slate-500">
                  {searchTerm || stageFilter !== 'all' 
                    ? 'Try adjusting your filters'
                    : 'There are no available orders for your assigned stages at the moment.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <Card 
                key={order.id} 
                className="shadow-lg hover:shadow-xl transition-all duration-200 border-2 hover:border-blue-300"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg">
                      Order #{order.id.substring(0, 8).toUpperCase()}
                    </CardTitle>
                    {order.isUrgent && (
                      <Badge variant="destructive" className="animate-pulse">
                        URGENT
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    <Badge className={`${getStageColor(order.currentStage)} border`}>
                      {order.currentStage.replace('_', ' ')}
                    </Badge>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Customer Info */}
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">{order.customerPhone}</span>
                  </div>
                  {order.customerName && (
                    <div className="text-sm text-slate-600">
                      Customer: {order.customerName}
                    </div>
                  )}

                  {/* Branch */}
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>{order.branch.name}</span>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Products Count */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Products:</span>
                      <Badge variant="outline">{order.products.length}</Badge>
                    </div>
                  </div>

                  {/* Current Claim Status */}
                  {order.stageClaims && order.stageClaims.length > 0 && (
                    <div className="text-xs text-slate-500">
                      {order.stageClaims.filter(c => !c.completedAt).length > 0 
                        ? '🔒 Currently claimed'
                        : '✅ Available to claim'}
                    </div>
                  )}
                </CardContent>

                <CardFooter>
                  <Button asChild className="w-full">
                    <Link to={`/orders/${order.id}`}>
                      View Details →
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default OrdersPage;
