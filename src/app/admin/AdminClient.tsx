'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, RefreshCw, Trash2, LogOut, Bus } from 'lucide-react';
import { approveCompany, disableCompany, enableCompany, deleteCompany } from './actions';

type Status = 'PENDING' | 'ACTIVE' | 'DISABLED';

type Company = {
  id: number;
  name: string;
  email: string;
  status: Status;
  emailVerified: boolean;
};

type Filter = 'ALL' | Status;

const STATUS_LABEL: Record<Status, string> = {
  PENDING: 'Na čekanju',
  ACTIVE: 'Aktivan',
  DISABLED: 'Deaktiviran',
};

const STATUS_VARIANT: Record<Status, 'default' | 'secondary' | 'destructive'> = {
  PENDING: 'secondary',
  ACTIVE: 'default',
  DISABLED: 'destructive',
};

export default function AdminClient({ companies }: { companies: Company[] }) {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<number | null>(null);
  const router = useRouter();

  const counts = {
    ALL: companies.length,
    PENDING: companies.filter((c) => c.status === 'PENDING').length,
    ACTIVE: companies.filter((c) => c.status === 'ACTIVE').length,
    DISABLED: companies.filter((c) => c.status === 'DISABLED').length,
  };

  const filtered = filter === 'ALL' ? companies : companies.filter((c) => c.status === filter);

  function act(id: number, fn: (id: number) => Promise<void>) {
    setActionId(id);
    startTransition(async () => {
      await fn(id);
      setActionId(null);
    });
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  const filterBtn = (f: Filter, label: string) => (
    <button
      key={f}
      onClick={() => setFilter(f)}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
      <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filter === f ? 'bg-gray-100' : 'bg-transparent'}`}>
        {counts[f]}
      </span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bus className="h-5 w-5 text-blue-600" />
          <span className="font-bold">UhvatiBus</span>
          <span className="text-gray-400 text-sm ml-1">/ Admin</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500">
          <LogOut className="h-4 w-4 mr-1.5" />
          Odjavi se
        </Button>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Kompanije</h1>
          <p className="text-gray-500 text-sm mt-1">Upravljajte kompanijama i odobrenjem naloga.</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
          {filterBtn('ALL', 'Sve')}
          {filterBtn('PENDING', 'Na čekanju')}
          {filterBtn('ACTIVE', 'Aktivne')}
          {filterBtn('DISABLED', 'Deaktivirane')}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>Nema kompanija u ovoj kategoriji.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-6 py-3 font-medium">Kompanija</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Email verif.</th>
                  <th className="text-right px-6 py-3 font-medium">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((company) => {
                  const busy = isPending && actionId === company.id;
                  return (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <div className="font-medium">{company.name}</div>
                        <div className="text-gray-400 text-xs">{company.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[company.status]}>
                          {STATUS_LABEL[company.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {company.emailVerified
                          ? <CheckCircle className="h-4 w-4 text-green-500" />
                          : <XCircle className="h-4 w-4 text-gray-300" />}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {company.status === 'PENDING' && (
                            <Button
                              size="sm"
                              disabled={busy}
                              onClick={() => act(company.id, approveCompany)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Odobri
                            </Button>
                          )}
                          {company.status === 'ACTIVE' && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => act(company.id, disableCompany)}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Deaktiviraj
                            </Button>
                          )}
                          {company.status === 'DISABLED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => act(company.id, enableCompany)}
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1" />
                              Aktiviraj
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => {
                              if (confirm(`Obriši kompaniju "${company.name}"? Ova akcija je nepovratna.`)) {
                                act(company.id, deleteCompany);
                              }
                            }}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
