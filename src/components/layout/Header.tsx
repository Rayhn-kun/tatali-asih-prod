import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, LogOut, Settings, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStore } from '@/store/useStore'
import { formatCurrency } from '@/lib/utils'

export const Header: React.FC = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout, getTotalItems, getTotalPrice } = useStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
            <span className="text-white font-bold text-sm">TA</span>
          </div>
          <span className="font-bold text-xl text-primary">Tatali Asih</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link 
            to="/catalog" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Katalog
          </Link>
          {isAuthenticated && (
            <Link 
              to="/orders" 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Pesanan Saya
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link 
              to="/admin" 
              className="text-sm font-medium transition-colors hover:text-primary flex items-center space-x-1"
            >
              <Settings className="h-4 w-4" />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* Cart */}
          {isAuthenticated && (
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
                {getTotalItems() > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {getTotalItems()}
                  </Badge>
                )}
              </Button>
            </Link>
          )}

          {/* User menu */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.role === 'ADMIN' ? 'Administrator' : 'Anggota'}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link to="/login">Masuk</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Daftar</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="md:hidden border-t px-4 py-2">
        <nav className="flex items-center justify-around">
          <Link 
            to="/catalog" 
            className="flex flex-col items-center space-y-1 text-xs font-medium transition-colors hover:text-primary"
          >
            <Package className="h-4 w-4" />
            <span>Katalog</span>
          </Link>
          {isAuthenticated && (
            <Link 
              to="/orders" 
              className="flex flex-col items-center space-y-1 text-xs font-medium transition-colors hover:text-primary"
            >
              <Package className="h-4 w-4" />
              <span>Pesanan</span>
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link 
              to="/admin" 
              className="flex flex-col items-center space-y-1 text-xs font-medium transition-colors hover:text-primary"
            >
              <Settings className="h-4 w-4" />
              <span>Admin</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}