import React, { useState, useEffect } from 'react';
import { Search, Filter, ShoppingCart, Plus, Minus } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/store/useStore';
import { fetchProducts } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/lib/api';

const Catalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const { addToCart, cart } = useStore();
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, [searchQuery, selectedCategory, page]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetchProducts({
        query: searchQuery,
        category: selectedCategory,
        page,
        size: 12
      });
      
      setProducts(response.data);
      setTotalPages(response.totalPages);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(response.data.map(p => p.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat produk. Silakan coba lagi.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast({
        title: 'Stok Habis',
        description: 'Produk ini sedang tidak tersedia.',
        variant: 'destructive'
      });
      return;
    }

    const cartItem = cart.find(item => item.productId === product.id);
    const currentQty = cartItem ? cartItem.quantity : 0;
    
    if (currentQty >= product.stock) {
      toast({
        title: 'Stok Tidak Cukup',
        description: `Stok tersedia: ${product.stock}`,
        variant: 'destructive'
      });
      return;
    }

    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price_rp,
      quantity: 1,
      imageUrl: product.image_url
    });

    toast({
      title: 'Berhasil',
      description: `${product.name} ditambahkan ke keranjang`,
    });
  };

  const getCartQuantity = (productId: number) => {
    const item = cart.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Katalog Produk</h1>
          <p className="text-gray-600">Temukan produk kesehatan berkualitas untuk kebutuhan Anda</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Semua Kategori</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <Button type="submit" className="px-6">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </form>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-48 bg-gray-200 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada produk ditemukan</h3>
            <p className="text-gray-600">Coba ubah kata kunci pencarian atau filter kategori</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const cartQty = getCartQuantity(product.id);
              const isOutOfStock = product.stock <= 0;
              const isMaxQty = cartQty >= product.stock;

              return (
                <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader className="p-0">
                    <div className="relative">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-primary to-secondary rounded-t-lg flex items-center justify-center">
                          <span className="text-white text-4xl">📦</span>
                        </div>
                      )}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-t-lg flex items-center justify-center">
                          <Badge variant="destructive" className="text-sm">Stok Habis</Badge>
                        </div>
                      )}
                      {product.category && (
                        <Badge className="absolute top-2 left-2" variant="secondary">
                          {product.category}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4">
                    <CardTitle className="text-lg mb-2 line-clamp-2">{product.name}</CardTitle>
                    {product.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                    )}
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(product.price_rp)}
                      </span>
                      {product.unit && (
                        <span className="text-sm text-gray-500">/{product.unit}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Stok: {product.stock}</span>
                      {cartQty > 0 && (
                        <span className="text-primary font-medium">Di keranjang: {cartQty}</span>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="p-4 pt-0">
                    <Button
                      onClick={() => handleAddToCart(product)}
                      disabled={isOutOfStock || isMaxQty}
                      className="w-full"
                      variant={isOutOfStock || isMaxQty ? "secondary" : "default"}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {isOutOfStock ? 'Stok Habis' : isMaxQty ? 'Stok Maksimal' : 'Tambah ke Keranjang'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            {[...Array(totalPages)].map((_, i) => (
              <Button
                key={i + 1}
                variant={page === i + 1 ? "default" : "outline"}
                onClick={() => setPage(i + 1)}
                className="w-10"
              >
                {i + 1}
              </Button>
            ))}
            
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalog;