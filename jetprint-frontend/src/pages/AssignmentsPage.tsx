import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { type StageClaim } from '../types';
import Header from '../components/Header';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Clock, Package, Phone, MapPin, Calendar, AlertCircle } from 'lucide-react';

const AssignmentsPage = () => {
  const [activeClaims, setActiveClaims] = useState<StageClaim[]>([]);
  const [completedClaims, setCompletedClaims] = useState<StageClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<StageClaim[]>('/stage-claims/my-assignments');
      const active = response.data.filter(c => c.completedAt === null);
      const completed = response.data.filter(c => c.completedAt !== null);
      setActiveClaims(active);
      setCompletedClaims(completed);
    } catch (err) {
      setError('Failed to fetch your assignments.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

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

  const AssignmentCard = ({ claim }: { claim: StageClaim }) => (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-200 border-2 hover:border-blue-300">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-lg">
            Order #{claim.order.id.substring(0, 8).toUpperCase()}
          </CardTitle>
          {!claim.completedAt ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Clock className="h-3 w-3 mr-1" />
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-50 text-gray-700">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>
        <Badge className={`${getStageColor(claim.stage)} border w-fit`}>
          {claim.stage.replace('_', ' ')}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Customer */}
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-slate-400" />
          <span className="font-medium">{claim.order.customerPhone}</span>
        </div>

        {/* Branch */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="h-4 w-4 text-slate-400" />
          <span>{claim.order.branch.name}</span>
        </div>

        {/* Claimed Date */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="h-4 w-4 text-slate-400" />
          <div className="flex flex-col">
            <span className="text-xs text-slate-500">Claimed:</span>
            <span>{new Date(claim.claimedAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Completed Date */}
        {claim.completedAt && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <div className="flex flex-col">
              <span className="text-xs text-slate-500">Completed:</span>
              <span className="font-medium">{new Date(claim.completedAt).toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Products Count */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-600">
              {claim.order.products.length} {claim.order.products.length === 1 ? 'Product' : 'Products'}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full">
          <Link to={`/orders/${claim.order.id}`}>
            View Order Details →
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );

  const LoadingSkeleton = () => (
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
  );

  const EmptyState = ({ type }: { type: 'active' | 'completed' }) => (
    <Card className="shadow-lg">
      <CardContent className="pt-12 pb-12 text-center">
        {type === 'active' ? (
          <>
            <Clock className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Active Assignments</h3>
            <p className="text-slate-500 mb-4">
              You don't have any active assignments right now.
            </p>
            <Button asChild>
              <Link to="/orders">Browse Available Orders</Link>
            </Button>
          </>
        ) : (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Completed Assignments</h3>
            <p className="text-slate-500">
              Your completed assignments will appear here.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">My Assignments</h1>
          <p className="text-slate-600">Orders you have claimed and are responsible for</p>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-900">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="active" className="gap-2">
              <Clock className="h-4 w-4" />
              Active
              <Badge variant="secondary" className="ml-2">{activeClaims.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completed
              <Badge variant="secondary" className="ml-2">{completedClaims.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Active Tab */}
          <TabsContent value="active">
            {loading ? (
              <LoadingSkeleton />
            ) : activeClaims.length === 0 ? (
              <EmptyState type="active" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeClaims.map((claim) => (
                  <AssignmentCard key={claim.id} claim={claim} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Completed Tab */}
          <TabsContent value="completed">
            {loading ? (
              <LoadingSkeleton />
            ) : completedClaims.length === 0 ? (
              <EmptyState type="completed" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedClaims.map((claim) => (
                  <AssignmentCard key={claim.id} claim={claim} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AssignmentsPage;
