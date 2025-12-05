import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, LogOut, Settings, Package, Cube } from 'lucide-react'
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
          <a
            href={`${import.meta.env.BASE_URL}hero/`}
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            3D
          </a>
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
                    variant="secondary" 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center"
                  >
                    {getTotalItems()}
                  </Badge>
                )}
              </Button>
            </Link>
          )}

          {/* Auth */}
          {isAuthenticated ? (
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Keluar
            </Button>
          ) : (
            <Link to="/login">
              <Button variant="default" size="sm">
                <User className="h-4 w-4 mr-2" /> Masuk
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="grid grid-cols-4 gap-1 px-4 py-2">
          <Link 
            to="/" 
            className="flex flex-col items-center space-y-1 text-xs font-medium transition-colors hover:text-primary"
          >
            <Package className="h-4 w-4" />
            <span>Beranda</span>
          </Link>
          <Link 
            to="/catalog" 
            className="flex flex-col items-center space-y-1 text-xs font-medium transition-colors hover:text-primary"
          >
            <Package className="h-4 w-4" />
            <span>Katalog</span>
          </Link>
          <a 
            href={`${import.meta.env.BASE_URL}hero/`} 
            className="flex flex-col items-center space-y-1 text-xs font-medium transition-colors hover:text-primary"
          >
            <Cube className="h-4 w-4" />
            <span>3D</span>
          </a>
          {user?.role === 'ADMIN' ? (
            <Link 
              to="/admin" 
              className="flex flex-col items-center space-y-1 text-xs font-medium transition-colors hover:text-primary"
            >
              <Settings className="h-4 w-4" />
              <span>Admin</span>
            </Link>
          ) : (
            isAuthenticated ? (
              <Link 
                to="/orders" 
                className="flex flex-col items-center space-y-1 text-xs font-medium transition-colors hover:text-primary"
              >
                <Package className="h-4 w-4" />
                <span>Pesanan</span>
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="flex flex-col items-center space-y-1 text-xs font-medium transition-colors hover:text-primary"
              >
                <User className="h-4 w-4" />
                <span>Masuk</span>
              </Link>
            )
          )}
        </div>
      </nav>
    </header>
  )
}