'use client';

import { useState } from 'react';
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
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const switchMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-md'>
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

        <div className='text-sm text-center mt-4'>
          {mode === 'login' ? (
            <>
              Nemaš nalog?
              <button className='text-blue-600 underline' onClick={switchMode}>
                Registruj se
              </button>
            </>
          ) : (
            <>
              Već imaš nalog?
              <button className='text-blue-600 underline' onClick={switchMode}>
                Prijavi se
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
