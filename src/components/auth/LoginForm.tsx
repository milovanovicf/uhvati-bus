'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Clock, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'disabled'>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('idle');
    setIsLoading(true);

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    setIsLoading(false);

    if (!res.ok) {
      const data = await res.json();
      if (data.error === 'EMAIL_NOT_VERIFIED') {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      if (data.error === 'PENDING_APPROVAL') {
        setStatus('pending');
        return;
      }
      if (data.error === 'ACCOUNT_DISABLED') {
        setStatus('disabled');
        return;
      }
      setError(t('auth.invalidCredentials'));
      return;
    }

    onSuccess();
    router.push('/company');
  };

  if (status === 'pending') {
    return (
      <div className="max-w-sm space-y-4">
        <div className="flex flex-col items-center gap-3 p-5 bg-amber-50 border border-amber-200 rounded-lg text-center">
          <Clock className="h-8 w-8 text-amber-500" />
          <div>
            <p className="font-semibold text-amber-800">{t('auth.pendingTitle')}</p>
            <p className="text-sm text-amber-700 mt-1">{t('auth.pendingMsg')}</p>
          </div>
        </div>
        <button
          className="text-sm text-gray-400 hover:text-gray-600 w-full text-center"
          onClick={() => setStatus('idle')}
        >
          ← {t('auth.backToLogin')}
        </button>
      </div>
    );
  }

  if (status === 'disabled') {
    return (
      <div className="max-w-sm space-y-4">
        <div className="flex flex-col items-center gap-3 p-5 bg-red-50 border border-red-200 rounded-lg text-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <div>
            <p className="font-semibold text-red-800">{t('auth.disabledTitle')}</p>
            <p className="text-sm text-red-700 mt-1">{t('auth.disabledMsg')}</p>
          </div>
        </div>
        <button
          className="text-sm text-gray-400 hover:text-gray-600 w-full text-center"
          onClick={() => setStatus('idle')}
        >
          ← {t('auth.backToLogin')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Input
        type="email"
        placeholder={t('auth.emailPlaceholder')}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder={t('auth.passwordPlaceholder')}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit" disabled={isLoading} className="cursor-pointer">
        {isLoading ? t('auth.loggingIn') : t('auth.loginBtn')}
      </Button>
    </form>
  );
}
