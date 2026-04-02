'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  async function handleLogout() {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    } finally {
      window.location.href = '/';
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 hover:text-white cursor-pointer"
    >
      <LogOut className="mr-2 h-4 w-4" /> Izloguj se
    </Button>
  );
}
