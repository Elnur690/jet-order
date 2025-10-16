import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Plus, Menu, Package, ListChecks, LayoutDashboard, LogOut, Search, Home } from 'lucide-react';
import OrderTrackingModal from './OrderTrackingModal';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [trackingOpen, setTrackingOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'ADMIN';

  const NavLinks = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={isMobile ? "flex flex-col space-y-4" : "hidden md:flex items-center space-x-1"}>
      <Button variant="ghost" asChild className={isMobile ? "justify-start" : ""}>
        <Link to="/orders" className="gap-2">
          <Package className="h-4 w-4" />
          Available Orders
        </Link>
      </Button>
      <Button variant="ghost" asChild className={isMobile ? "justify-start" : ""}>
        <Link to="/assignments" className="gap-2">
          <ListChecks className="h-4 w-4" />
          My Assignments
        </Link>
      </Button>
      {isAdmin && (
        <Button variant="ghost" asChild className={isMobile ? "justify-start" : ""}>
          <Link to="/dashboard" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/orders" className="flex items-center space-x-2">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
            <Home className="h-5 w-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              JetPrint
            </h1>
            <p className="text-xs text-slate-500">Order Management</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <NavLinks />

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Track Order Button */}
          <Button 
            variant="outline" 
            onClick={() => setTrackingOpen(true)}
            className="gap-2 hidden md:flex"
          >
            <Search className="h-4 w-4" />
            <span>Track Order</span>
          </Button>

          {/* New Order Button */}
          <Button asChild className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Link to="/new-order">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Order</span>
            </Link>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    {user?.phone.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.phone}</p>
                  <Badge variant={isAdmin ? "default" : "secondary"} className="w-fit">
                    {user?.role}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/orders" className="cursor-pointer">
                  <Package className="mr-2 h-4 w-4" />
                  Available Orders
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/assignments" className="cursor-pointer">
                  <ListChecks className="mr-2 h-4 w-4" />
                  My Assignments
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col space-y-4 mt-6">
                <div className="border-b pb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        {user?.phone.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user?.phone}</p>
                      <Badge variant={isAdmin ? "default" : "secondary"} className="mt-1">
                        {user?.role}
                      </Badge>
                    </div>
                  </div>
                </div>
                <NavLinks isMobile />
                <Button variant="outline" onClick={handleLogout} className="justify-start gap-2 text-red-600 hover:text-red-700">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* Order Tracking Modal */}
      <OrderTrackingModal open={trackingOpen} onOpenChange={setTrackingOpen} />
    </header>
  );
};

export default Header;
