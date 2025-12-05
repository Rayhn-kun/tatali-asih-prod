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
  const { cart, updateCartQuantity, removeFromCart, clearCart, user } = useStore();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'AMBIL' | 'ANTAR_KELAS'>('AMBIL');
  const [addressOrClass, setAddressOrClass] = useState('');
  const [notes, setNotes] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = deliveryMethod === 'ANTAR_KELAS' ? 5000 : 0;
  const total = subtotal + deliveryFee;

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    updateCartQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId: number, productName: string) => {
    removeFromCart(productId);
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

    if (cart.length === 0) {
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
        items: cart.map(item => ({
          productId: item.productId,
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
        description: `Pesanan ${response.order_code} telah dibuat. Silakan tunggu konfirmasi admin.`,
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

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <ShoppingBag className="mx-auto h-24 w-24 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Keranjang Kosong</h2>
            <p className="text-gray-600 mb-6">Belum ada produk dalam keranjang Anda</p>
            <Button onClick={() => navigate('/catalog')} className="px-8">
              Mulai Belanja
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/catalog')}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Keranjang Belanja</h1>
            <p className="text-gray-600">{cart.length} item dalam keranjang</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <Card key={item.productId}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-white text-2xl">📦</span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                      <p className="text-primary font-bold">{formatCurrency(item.price)}</p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Total Price */}
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.productId, item.name)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="AMBIL"
                      checked={deliveryMethod === 'AMBIL'}
                      onChange={(e) => setDeliveryMethod(e.target.value as 'AMBIL')}
                      className="text-primary"
                    />
                    <span>Ambil di Koperasi (Gratis)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="ANTAR_KELAS"
                      checked={deliveryMethod === 'ANTAR_KELAS'}
                      onChange={(e) => setDeliveryMethod(e.target.value as 'ANTAR_KELAS')}
                      className="text-primary"
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
      </div>
    </div>
  );
};

export default Cart;