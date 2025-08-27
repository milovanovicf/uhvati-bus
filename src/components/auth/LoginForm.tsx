'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Login failed');
      return;
    }

    onSuccess(); // ✅ closes the modal
    router.push('/company'); // ✅ redirect after close
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className='text-red-500'>{error}</p>}
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
      <Button type='submit'>Prijavi se</Button>
    </form>
  );
}
