'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Registration failed');
    } else {
      alert('Uspešna registracija');
      // redirect or update UI
    }
  };

  return (
    <form onSubmit={handleRegister} className='space-y-4 max-w-sm'>
      <Input
        placeholder='Ime firme'
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        type='email'
        placeholder='Email'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type='password'
        placeholder='Lozinka'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type='submit'>Registruj se</Button>
    </form>
  );
}
