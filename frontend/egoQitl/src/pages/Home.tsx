import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Users, TrendingUp, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WaveBackground } from '@/components/three/WaveBackground'
import { useStore } from '@/store/useStore'

export const Home: React.FC = () => {
  const { isAuthenticated } = useStore()

  const features = [
    {
      icon: ShoppingCart,
      title: 'Pemesanan Mudah',
      description: 'Pesan produk kesehatan dengan mudah melalui katalog digital yang lengkap.'
    },
    {
      icon: Users,
      title: 'Khusus Anggota',
      description: 'Sistem koperasi yang eksklusif untuk anggota sekolah dengan harga terjangkau.'
    },
    {
      icon: TrendingUp,
      title: 'Laporan Real-time',
      description: 'Pantau penjualan dan stok dengan laporan yang akurat dan real-time.'
    },
    {
      icon: Shield,
      title: 'Aman & Terpercaya',
      description: 'Sistem keamanan berlapis untuk melindungi data dan transaksi Anda.'
    }
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <WaveBackground className="opacity-50" />
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Koperasi Sekolah
              <span className="block text-primary">Tatali Asih</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Platform digital untuk pemesanan produk kesehatan koperasi sekolah. 
              Mudah, aman, dan terpercaya untuk seluruh anggota.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Button size="lg" asChild>
                    <Link to="/catalog">
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Lihat Katalog
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/orders">Pesanan Saya</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <Link to="/register">
                      <Users className="mr-2 h-5 w-5" />
                      Daftar Sekarang
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/login">Masuk</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Mengapa Memilih Tatali Asih?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Kami menyediakan solusi terbaik untuk kebutuhan koperasi sekolah modern
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-gray-600">Anggota Aktif</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50+</div>
              <div className="text-gray-600">Produk Kesehatan</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">1000+</div>
              <div className="text-gray-600">Pesanan Selesai</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Siap Bergabung dengan Koperasi Tatali Asih?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Dapatkan akses ke produk kesehatan berkualitas dengan harga terjangkau
          </p>
          {!isAuthenticated && (
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">
                Daftar Sekarang
              </Link>
            </Button>
          )}
        </div>
      </section>
    </div>
  )
}