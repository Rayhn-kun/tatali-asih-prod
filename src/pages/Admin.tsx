import React, { useState, useEffect } from 'react';
import { 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Upload,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/store/useStore';
import { 
  fetchProducts, 
  fetchAllOrders, 
  updateOrderStatus, 
  fetchMonthlyReport,
  createProduct,
  updateProduct,
  deleteProduct
} from '@/lib/api';
import { formatCurrency, formatDate, getStatusColor, getStatusText } from '@/lib/utils';
import type { Product, Order } from '@/lib/api';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'reports'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Product form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    unit: '',
    price_rp: 0,
    stock: 0,
    description: '',
    image_url: ''
  });

  const { user } = useStore();
  const { toast } = useToast();

  useEffect(() => {
    if (activeTab === 'products') {
      loadProducts();
    } else if (activeTab === 'orders') {
      loadOrders();
    }
  }, [activeTab]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetchProducts({ size: 100 });
      setProducts(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat produk',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetchAllOrders();
      setOrders(response);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat pesanan',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productForm);
        toast({ title: 'Berhasil', description: 'Produk berhasil diperbarui' });
      } else {
        await createProduct(productForm);
        toast({ title: 'Berhasil', description: 'Produk berhasil ditambahkan' });
      }
      
      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm({
        name: '',
        category: '',
        unit: '',
        price_rp: 0,
        stock: 0,
        description: '',
        image_url: ''
      });
      loadProducts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan produk',
        variant: 'destructive'
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category || '',
      unit: product.unit || '',
      price_rp: product.price_rp,
      stock: product.stock,
      description: product.description || '',
      image_url: product.image_url || ''
    });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Hapus produk "${product.name}"?`)) return;
    
    try {
      await deleteProduct(product.id);
      toast({ title: 'Berhasil', description: 'Produk berhasil dihapus' });
      loadProducts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus produk',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string, notes?: string) => {
    try {
      await updateOrderStatus(orderId, newStatus, notes);
      toast({ title: 'Berhasil', description: 'Status pesanan berhasil diperbarui' });
      loadOrders();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memperbarui status',
        variant: 'destructive'
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredOrders = orders.filter(order =>
    (statusFilter === '' || order.status === statusFilter) &&
    (order.order_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
     order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const tabs = [
    { id: 'products', label: 'Produk', icon: Package },
    { id: 'orders', label: 'Pesanan', icon: ShoppingCart },
    { id: 'reports', label: 'Laporan', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Admin</h1>
          <p className="text-gray-600">Kelola produk, pesanan, dan laporan koperasi</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-white p-1 rounded-lg shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Products Header */}
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex gap-2">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cari produk..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={loadProducts} variant="outline">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={() => setShowProductForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Tambah Produk
              </Button>
            </div>

            {/* Product Form Modal */}
            {showProductForm && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProductSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Nama Produk"
                        value={productForm.name}
                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                        required
                      />
                      <Input
                        placeholder="Kategori"
                        value={productForm.category}
                        onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                      />
                      <Input
                        placeholder="Satuan (pcs, box, dll)"
                        value={productForm.unit}
                        onChange={(e) => setProductForm({...productForm, unit: e.target.value})}
                      />
                      <Input
                        type="number"
                        placeholder="Harga (Rp)"
                        value={productForm.price_rp}
                        onChange={(e) => setProductForm({...productForm, price_rp: parseInt(e.target.value) || 0})}
                        required
                      />
                      <Input
                        type="number"
                        placeholder="Stok"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({...productForm, stock: parseInt(e.target.value) || 0})}
                        required
                      />
                      <Input
                        placeholder="URL Gambar"
                        value={productForm.image_url}
                        onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                      />
                    </div>
                    <textarea
                      placeholder="Deskripsi produk"
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md resize-none h-20"
                    />
                    <div className="flex gap-2">
                      <Button type="submit">
                        {editingProduct ? 'Perbarui' : 'Tambah'} Produk
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setShowProductForm(false);
                          setEditingProduct(null);
                        }}
                      >
                        Batal
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Products Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produk
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kategori
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Harga
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stok
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProducts.map((product) => (
                        <tr key={product.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-3">
                                <span className="text-white text-sm">📦</span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {product.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  SKU: {product.sku || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {product.category && (
                              <Badge variant="secondary">{product.category}</Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(product.price_rp)}
                            {product.unit && <span className="text-gray-500">/{product.unit}</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                              {product.stock}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteProduct(product)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Orders Header */}
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex gap-2">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cari pesanan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Semua Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="DIPROSES">Diproses</option>
                  <option value="SELESAI">Selesai</option>
                  <option value="DITOLAK">Ditolak</option>
                </select>
                <Button onClick={loadOrders} variant="outline">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{order.order_code}</CardTitle>
                        <p className="text-sm text-gray-600">{order.user?.name}</p>
                        <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                      </div>
                      <Badge variant={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-semibold">{formatCurrency(order.subtotal_rp)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Items:</span>
                        <span>{order.items?.length || 0} produk</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pengambilan:</span>
                        <span>{order.delivery_method === 'AMBIL' ? 'Ambil' : 'Antar'}</span>
                      </div>
                    </div>

                    {order.notes && (
                      <div className="p-2 bg-gray-50 rounded text-xs">
                        <span className="text-gray-600">Catatan: </span>
                        {order.notes}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {order.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(order.id, 'DIPROSES')}
                            className="flex-1"
                          >
                            Proses
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const reason = prompt('Alasan penolakan:');
                              if (reason) {
                                handleUpdateOrderStatus(order.id, 'DITOLAK', reason);
                              }
                            }}
                            className="flex-1"
                          >
                            Tolak
                          </Button>
                        </>
                      )}
                      {order.status === 'DIPROSES' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateOrderStatus(order.id, 'SELESAI')}
                          className="w-full"
                        >
                          Selesai
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Laporan Bulanan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="mx-auto h-24 w-24 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Fitur Laporan</h3>
                  <p className="text-gray-600 mb-6">
                    Fitur laporan akan tersedia setelah backend API lengkap
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Export PDF
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Export Excel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;