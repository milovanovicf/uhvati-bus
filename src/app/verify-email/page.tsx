'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MailCheck } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      inputs.current[5]?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const code = digits.join('');
    if (code.length < 6) {
      setError('Unesite svih 6 cifara koda.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error === 'Invalid or expired code'
          ? 'Kod je neispravan ili je istekao. Zatražite novi kod.'
          : 'Greška pri verifikaciji. Pokušajte ponovo.');
      } else {
        router.push('/company');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResent(false);
    setError('');
    await fetch('/api/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setResent(true);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-sm border p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 rounded-full p-3">
            <MailCheck className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Verifikujte email adresu
        </h1>
        <p className="text-gray-500 mb-1 text-sm">
          Poslali smo 6-cifreni kod na
        </p>
        <p className="text-gray-800 font-medium mb-6 text-sm">{email}</p>

        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <Input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                maxLength={1}
                inputMode="numeric"
                className="w-11 h-12 text-center text-xl font-bold"
              />
            ))}
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {resent && <p className="text-green-600 text-sm mb-4">Nov kod je poslat.</p>}

          <Button type="submit" disabled={loading} className="w-full mb-4">
            {loading ? 'Verifikacija...' : 'Potvrdi'}
          </Button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          className="text-sm text-blue-600 hover:underline"
        >
          Nisam dobio/la kod — pošalji ponovo
        </button>
      </div>
    </div>
  );
}
