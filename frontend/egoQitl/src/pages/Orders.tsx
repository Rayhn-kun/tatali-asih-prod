import React, { useState, useEffect } from 'react';
import { Eye, Package, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/store/useStore';
import { fetchMyOrders } from '@/lib/api';
import { formatCurrency, formatDate, getStatusColor, getStatusText } from '@/lib/utils';
import type { Order } from '@/lib/api';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const { user } = useStore();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetchMyOrders();
      setOrders(response);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat riwayat pesanan. Silakan coba lagi.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'DIPROSES':
        return <Package className="h-4 w-4" />;
      case 'SELESAI':
        return <CheckCircle className="h-4 w-4" />;
      case 'DITOLAK':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getDeliveryMethodText = (method: string) => {
    return method === 'AMBIL' ? 'Ambil di Koperasi' : 'Antar ke Kelas';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Riwayat Pesanan</h1>
            <p className="text-gray-600">Lacak status pesanan Anda</p>
          </div>
          <Button onClick={loadOrders} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-24 w-24 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Belum Ada Pesanan</h2>
            <p className="text-gray-600 mb-6">Anda belum pernah membuat pesanan</p>
            <Button onClick={() => window.location.href = '/catalog'} className="px-8">
              Mulai Belanja
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders List */}
            <div className="space-y-4">
              {orders.map((order) => (
                <Card 
                  key={order.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedOrder?.id === order.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{order.orderCode}</CardTitle>
                        <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                      </div>
                      <Badge 
                        variant={getStatusColor(order.status)}
                        className="gap-1"
                      >
                        {getStatusIcon(order.status)}
                        {getStatusText(order.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-semibold">{formatCurrency(order.subtotalRp)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pengambilan:</span>
                        <span>{getDeliveryMethodText(order.deliveryMethod)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Items:</span>
                        <span>{order.items?.length || 0} produk</span>
                      </div>
                    </div>
                    
                    {order.notes && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                        <span className="text-gray-600">Catatan: </span>
                        <span>{order.notes}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Details */}
            <div className="lg:sticky lg:top-8">
              {selectedOrder ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Detail Pesanan
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Order Info */}
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Kode Pesanan:</span>
                        <span className="font-mono font-semibold">{selectedOrder.orderCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tanggal:</span>
                        <span>{formatDate(selectedOrder.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge variant={getStatusColor(selectedOrder.status)} className="gap-1">
                          {getStatusIcon(selectedOrder.status)}
                          {getStatusText(selectedOrder.status)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pengambilan:</span>
                        <span>{getDeliveryMethodText(selectedOrder.deliveryMethod)}</span>
                      </div>
                      {selectedOrder.addressOrClass && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Alamat/Kelas:</span>
                          <span>{selectedOrder.addressOrClass}</span>
                        </div>
                      )}
                    </div>

                    <hr />

                    {/* Order Items */}
                    <div>
                      <h4 className="font-semibold mb-3">Item Pesanan</h4>
                      <div className="space-y-3">
                        {selectedOrder.items?.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium">{item.product?.name || 'Produk'}</p>
                              <p className="text-sm text-gray-600">
                                {item.qty} × {formatCurrency(item.priceRp)}
                              </p>
                            </div>
                            <span className="font-semibold">
                              {formatCurrency(item.priceRp * item.qty)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <hr />

                    {/* Total */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Pesanan:</span>
                        <span className="text-primary">{formatCurrency(selectedOrder.subtotalRp)}</span>
                      </div>
                    </div>

                    {/* Notes */}
                    {selectedOrder.notes && (
                      <>
                        <hr />
                        <div>
                          <h4 className="font-semibold mb-2">Catatan</h4>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded">
                            {selectedOrder.notes}
                          </p>
                        </div>
                      </>
                    )}

                    {/* Status Timeline */}
                    <div>
                      <h4 className="font-semibold mb-3">Status Timeline</h4>
                      <div className="space-y-2">
                        <div className={`flex items-center gap-2 ${
                          ['PENDING', 'DIPROSES', 'SELESAI', 'DITOLAK'].includes(selectedOrder.status) 
                            ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Pesanan dibuat</span>
                        </div>
                        <div className={`flex items-center gap-2 ${
                          ['DIPROSES', 'SELESAI'].includes(selectedOrder.status) 
                            ? 'text-green-600' : selectedOrder.status === 'DITOLAK' 
                            ? 'text-red-600' : 'text-gray-400'
                        }`}>
                          {selectedOrder.status === 'DITOLAK' ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          <span className="text-sm">
                            {selectedOrder.status === 'DITOLAK' ? 'Pesanan ditolak' : 'Pesanan diproses'}
                          </span>
                        </div>
                        {selectedOrder.status === 'SELESAI' && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Pesanan selesai</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Eye className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">Pilih pesanan untuk melihat detail</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;