import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/store/useStore';
import { createOrder } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, user } = useStore();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'AMBIL' | 'ANTAR_KELAS'>('AMBIL');
  const [addressOrClass, setAddressOrClass] = useState('');
  const [notes, setNotes] = useState('');

  const subtotal = items.reduce((sum, item) => sum + ((item.product.priceRp || 0) * item.quantity), 0);
  const deliveryFee = deliveryMethod === 'ANTAR_KELAS' ? 5000 : 0;
  const total = subtotal + deliveryFee;

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }
    updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId: number, productName: string) => {
    removeItem(productId);
    toast({
      title: 'Item Dihapus',
      description: `${productName} telah dihapus dari keranjang`,
    });
  };

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: 'Login Diperlukan',
        description: 'Silakan login terlebih dahulu untuk melanjutkan pemesanan',
        variant: 'destructive'
      });
      navigate('/login');
      return;
    }

    if (items.length === 0) {
      toast({
        title: 'Keranjang Kosong',
        description: 'Tambahkan produk ke keranjang terlebih dahulu',
        variant: 'destructive'
      });
      return;
    }

    if (deliveryMethod === 'ANTAR_KELAS' && !addressOrClass.trim()) {
      toast({
        title: 'Alamat Diperlukan',
        description: 'Silakan masukkan kelas/alamat untuk pengiriman',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      
      const orderData = {
        items: items.map(item => ({
          productId: item.product.id,
          qty: item.quantity
        })),
        deliveryMethod,
        addressOrClass: deliveryMethod === 'ANTAR_KELAS' ? addressOrClass : undefined,
        notes: notes.trim() || undefined
      };

      const response = await createOrder(orderData);
      
      clearCart();
      toast({
        title: 'Pesanan Berhasil',
        description: `Pesanan ${response.orderCode} telah dibuat. Silakan tunggu konfirmasi admin.`,
      });
      
      navigate('/orders');
    } catch (error: any) {
      toast({
        title: 'Gagal Membuat Pesanan',
        description: error.message || 'Terjadi kesalahan saat membuat pesanan',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Button 
          variant="ghost" 
          className="mb-6 pl-0 hover:pl-2 transition-all"
          onClick={() => navigate('/catalog')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Katalog
        </Button>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Keranjang Belanja</h1>

        {items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <ShoppingBag className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Keranjang Anda Kosong</h3>
            <p className="text-gray-600 mb-6">Belum ada produk yang ditambahkan</p>
            <Button onClick={() => navigate('/catalog')}>
              Mulai Belanja
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.product.id}>
                  <CardContent className="p-4 flex gap-4">
                    {item.product.imageUrl ? (
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.name} 
                        className="w-24 h-24 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center">
                        <span className="text-2xl">📦</span>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <h3 className="font-semibold text-lg">{item.product.name}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-red-500"
                          onClick={() => handleRemoveItem(item.product.id, item.product.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <p className="text-primary font-bold mb-4">
                        {formatCurrency(item.product.priceRp || 0)}
                      </p>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-r-none"
                            onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-10 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-l-none"
                            onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-sm text-gray-500">
                          Subtotal: {formatCurrency((item.product.priceRp || 0) * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              {/* Delivery Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Metode Pengambilan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        value="AMBIL"
                        checked={deliveryMethod === 'AMBIL'}
                        onChange={(e) => setDeliveryMethod(e.target.value as 'AMBIL')}
                        className="text-primary focus:ring-primary"
                      />
                      <span>Ambil di Koperasi (Gratis)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        value="ANTAR_KELAS"
                        checked={deliveryMethod === 'ANTAR_KELAS'}
                        onChange={(e) => setDeliveryMethod(e.target.value as 'ANTAR_KELAS')}
                        className="text-primary focus:ring-primary"
                      />
                      <span>Antar ke Kelas (+{formatCurrency(5000)})</span>
                    </label>
                  </div>

                  {deliveryMethod === 'ANTAR_KELAS' && (
                    <Input
                      placeholder="Masukkan kelas (contoh: XII IPA 1)"
                      value={addressOrClass}
                      onChange={(e) => setAddressOrClass(e.target.value)}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Catatan Pesanan</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    placeholder="Tambahkan catatan untuk pesanan Anda (opsional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Ringkasan Pesanan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Biaya Pengiriman</span>
                    <span>{formatCurrency(deliveryFee)}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(total)}</span>
                  </div>
                  
                  <Button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full mt-6"
                    size="lg"
                  >
                    {loading ? 'Memproses...' : 'Buat Pesanan'}
                  </Button>
                  
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Dengan melanjutkan, Anda menyetujui syarat dan ketentuan yang berlaku
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;