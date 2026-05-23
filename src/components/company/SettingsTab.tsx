'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Company } from '@/generated/prisma';
import { updateCompanySettings } from '@/app/actions';

export default function SettingsTab({
  company,
  isPending: tabPending,
}: {
  company: Company;
  isPending: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(company.name);
  const [email, setEmail] = useState(company.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = () => {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set('name', name);
        formData.set('email', email);
        formData.set('currentPassword', currentPassword);
        formData.set('newPassword', newPassword);
        formData.set('confirmPassword', confirmPassword);
        await updateCompanySettings(formData);
        setSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (err: any) {
        setError(err.message || 'Greška pri čuvanju podešavanja.');
      }
    });
  };

  const disabled = tabPending || isPending;

  return (
    <div className="space-y-6 max-w-md">
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
          Podešavanja su uspešno sačuvana.
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4">Profil kompanije</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="settings-name">Naziv kompanije</Label>
            <Input
              id="settings-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={disabled}
            />
          </div>
          <div>
            <Label htmlFor="settings-email">Email adresa</Label>
            <Input
              id="settings-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <hr />

      <div>
        <h3 className="text-lg font-semibold mb-1">Promena lozinke</h3>
        <p className="text-sm text-gray-500 mb-4">
          Ostavite prazno ako ne želite da promenite lozinku.
        </p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="current-password">Trenutna lozinka</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={disabled}
              placeholder="Unesite trenutnu lozinku"
            />
          </div>
          <div>
            <Label htmlFor="new-password">Nova lozinka</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={disabled}
              placeholder="Najmanje 8 karaktera"
            />
          </div>
          <div>
            <Label htmlFor="confirm-password">Potvrdi novu lozinku</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={disabled}
              placeholder="Ponovite novu lozinku"
            />
          </div>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={disabled || !name || !email}
      >
        {isPending ? 'Čuvanje...' : 'Sačuvaj'}
      </Button>
    </div>
  );
}
