'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import RegisterForm from './RegisterForm';
import LoginForm from './LoginForm';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function AuthModal({
  open,
  onClose,
  mode: initialMode,
}: {
  open: boolean;
  onClose: () => void;
  mode: string;
}) {
  const [mode, setMode] = useState(initialMode);
  const { t } = useTranslation();

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
  };

  useEffect(() => {
    if (open) {
      setMode(initialMode);
    }
  }, [open, initialMode]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
          </DialogTitle>
        </DialogHeader>

        {mode === 'login' ? (
          <LoginForm onSuccess={onClose} />
        ) : (
          <RegisterForm onSuccess={onClose} />
        )}

        <div className="text-sm text-center mt-4">
          {mode === 'login' ? (
            <>
              {t('auth.noAccount')}{' '}
              <button className="text-blue-600 underline" onClick={switchMode}>
                {t('auth.registerLink')}
              </button>
            </>
          ) : (
            <>
              {t('auth.hasAccount')}{' '}
              <button
                className="text-blue-600 underline cursor-pointer"
                onClick={switchMode}
              >
                {t('auth.loginLink')}
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
