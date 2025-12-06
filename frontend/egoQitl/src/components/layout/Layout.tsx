import React from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Toaster } from '@/components/ui/toaster'

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Toaster />
    </div>
  )
}