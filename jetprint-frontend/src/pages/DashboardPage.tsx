import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { UserRole, OrderStage } from '../types';
import Header from '../components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  DollarSign, 
  Package, 
  TrendingUp, 
  Users, 
  UserPlus, 
  Trash2, 
  Edit, 
  Plus,
  Settings,
  BarChart3,
  Loader2
} from 'lucide-react';

interface Statistics {
  overall: {
    totalOrders: number;
    totalOrderAmount: string;
    totalDesignAmount: string;
    totalShippingAmount: string;
    grandTotal: string;
  };
  byUser: Array<{
    userId: string;
    phone: string;
    ordersCreated: number;
    totalAmount: string;
    designAmount: string;
    shippingAmount: string;
  }>;
  byStage: Array<{
    stage: string;
    count: number;
  }>;
}

interface User {
  id: string;
  phone: string;
  role: UserRole;
  stages?: Array<{ id: string; name: OrderStage }>;
}

interface Branch {
  id: string;
  name: string;
}

interface Stage {
  id: string;
  name: OrderStage;
  users: Array<{ id: string; phone: string }>;
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);

  // User Dialog State
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.STAFF);
  const [userCreating, setUserCreating] = useState(false);

  // Branch Dialog State
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchName, setBranchName] = useState('');
  const [branchSaving, setBranchSaving] = useState(false);

  // Stage Assignment Dialog
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [assigningUser, setAssigningUser] = useState<User | null>(null);
  const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
  const [stageAssigning, setStageAssigning] = useState(false);

    const fetchData = async () => {
      try {
      setLoading(true);
      const [statsRes, usersRes, branchesRes, stagesRes] = await Promise.all([
        api.get<Statistics>('/admin/statistics'),
          api.get<User[]>('/users'),
        api.get<Branch[]>('/branches'),
        api.get<Stage[]>('/admin/stages'),
      ]);
      setStatistics(statsRes.data);
      setUsers(usersRes.data);
      setBranches(branchesRes.data);
      setStages(stagesRes.data);
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async () => {
    if (!newUserPhone.trim()) {
      toast.error('Phone number is required');
      return;
    }

    try {
      setUserCreating(true);
      await api.post('/users', { phone: newUserPhone, role: newUserRole });
      toast.success('User created successfully');
      setUserDialogOpen(false);
      setNewUserPhone('');
      setNewUserRole(UserRole.STAFF);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setUserCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string, phone: string) => {
    if (!confirm(`Are you sure you want to delete user ${phone}?`)) return;

    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to delete user');
    }
  };

  const handleOpenStageAssignment = (user: User) => {
    setAssigningUser(user);
    const userStageIds = user.stages?.map(s => s.id) || [];
    setSelectedStageIds(userStageIds);
    setStageDialogOpen(true);
  };

  const handleAssignStages = async () => {
    if (!assigningUser) return;

    try {
      setStageAssigning(true);
      await api.patch(`/users/${assigningUser.id}/stages`, { stageIds: selectedStageIds });
      toast.success('Stages assigned successfully');
      setStageDialogOpen(false);
      setAssigningUser(null);
      setSelectedStageIds([]);
      fetchData();
    } catch (error: any) {
      toast.error('Failed to assign stages');
    } finally {
      setStageAssigning(false);
    }
  };

  const handleSaveBranch = async () => {
    if (!branchName.trim()) {
      toast.error('Branch name is required');
      return;
    }

    try {
      setBranchSaving(true);
      if (editingBranch) {
        await api.patch(`/branches/${editingBranch.id}`, { name: branchName });
        toast.success('Branch updated successfully');
      } else {
        await api.post('/branches', { name: branchName });
        toast.success('Branch created successfully');
      }
      setBranchDialogOpen(false);
      setEditingBranch(null);
      setBranchName('');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save branch');
    } finally {
      setBranchSaving(false);
    }
  };

  const handleDeleteBranch = async (branchId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete branch "${name}"?`)) return;

    try {
      await api.delete(`/branches/${branchId}`);
      toast.success('Branch deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to delete branch');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage users, branches, and view system statistics
          </p>
        </div>

        {/* Stats Grid */}
        {statistics && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.overall.totalOrders}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${statistics.overall.grandTotal}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Design Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${statistics.overall.totalDesignAmount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="branches">
              <Settings className="h-4 w-4 mr-2" />
              Branches
            </TabsTrigger>
            <TabsTrigger value="stages">
              <BarChart3 className="h-4 w-4 mr-2" />
              Stages
            </TabsTrigger>
            <TabsTrigger value="stats">
              <TrendingUp className="h-4 w-4 mr-2" />
              Statistics
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Create and manage system users</CardDescription>
                  </div>
                  <Button onClick={() => setUserDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Assigned Stages</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.phone}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === UserRole.ADMIN ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenStageAssignment(user)}
                          >
                            {user.stages?.length || 0} stages
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.phone)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branches Tab */}
          <TabsContent value="branches" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Branch Management</CardTitle>
                    <CardDescription>Manage JetPrint locations</CardDescription>
                  </div>
                  <Button onClick={() => { setBranchDialogOpen(true); setEditingBranch(null); setBranchName(''); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Branch
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {branches.map((branch) => (
                    <Card key={branch.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{branch.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setEditingBranch(branch);
                            setBranchName(branch.name);
                            setBranchDialogOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteBranch(branch.id, branch.name)}
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stages Tab */}
          <TabsContent value="stages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Stage Management</CardTitle>
                <CardDescription>View workflow stages and assigned users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stages.map((stage) => (
                  <Card key={stage.id}>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        {stage.name.replace('_', ' ')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {stage.users.length > 0 ? (
                          stage.users.map((user) => (
                            <Badge key={user.id} variant="secondary">
                              {user.phone}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">No users assigned</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead>Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statistics?.byUser.map((user) => (
                        <TableRow key={user.userId}>
                          <TableCell>{user.phone}</TableCell>
                          <TableCell>{user.ordersCreated}</TableCell>
                          <TableCell className="font-semibold">${user.totalAmount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Orders by Stage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {statistics?.byStage.map((stage) => (
                    <div key={stage.stage} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{stage.stage.replace('_', ' ')}</span>
                      <Badge>{stage.count}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create User Dialog */}
        <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add a new user to the system</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="1234567890"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.STAFF}>Staff</SelectItem>
                    <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUserDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateUser} disabled={userCreating}>
                {userCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Branch Dialog */}
        <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBranch ? 'Edit Branch' : 'Create Branch'}</DialogTitle>
              <DialogDescription>
                {editingBranch ? 'Update branch information' : 'Add a new branch location'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="branchName">Branch Name</Label>
                <Input
                  id="branchName"
                  placeholder="Downtown Branch"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                />
          </div>
        </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBranchDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveBranch} disabled={branchSaving}>
                {branchSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingBranch ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stage Assignment Dialog */}
        <Dialog open={stageDialogOpen} onOpenChange={setStageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Stages to {assigningUser?.phone}</DialogTitle>
              <DialogDescription>Select which stages this user can work on</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {stages.map((stage) => (
                <div key={stage.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`stage-${stage.id}`}
                    checked={selectedStageIds.includes(stage.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStageIds([...selectedStageIds, stage.id]);
                      } else {
                        setSelectedStageIds(selectedStageIds.filter(id => id !== stage.id));
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor={`stage-${stage.id}`} className="text-sm font-medium cursor-pointer">
                    {stage.name.replace('_', ' ')}
                  </label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStageDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAssignStages} disabled={stageAssigning}>
                {stageAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign Stages
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DashboardPage;
