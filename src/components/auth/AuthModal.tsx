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
            {mode === 'login' ? 'Prijavi se' : 'Registruj se'}
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
              Nemaš nalog?
              <button className="text-blue-600 underline" onClick={switchMode}>
                Registruj se
              </button>
            </>
          ) : (
            <>
              Već imaš nalog?
              <button
                className="text-blue-600 underline cursor-pointer"
                onClick={switchMode}
              >
                Prijavi se
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
