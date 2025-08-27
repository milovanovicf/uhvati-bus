'use client';

import React, { useEffect, useState } from 'react';
const { DateTime } = require('luxon');
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
} from '@/components/ui/modal';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Plus, LogOut, Edit, Trash } from 'lucide-react';

// NOTE: adjust imports above to match your project paths for shadcn components.

type Trip = {
  id: number;
  routeId: number;
  companyId: number;
  departure: string; // ISO
  arrival: string; // ISO
  seatsTotal: number;
  route?: {
    id: number;
    from: { id: number; name: string };
    to: { id: number; name: string };
  };
};

export default function CompanyAdminDashboard() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [routeFrom, setRouteFrom] = useState('');
  const [routeTo, setRouteTo] = useState('');
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('10:00');
  const [arrivalDate, setArrivalDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('12:30');
  const [seatsTotal, setSeatsTotal] = useState(50);

  useEffect(() => {
    fetchTrips();
  }, []);

  async function fetchTrips() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/trip', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch trips');
      const data = await res.json();
      setTrips(data);
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  function combineToUtcIso(date: string, time: string) {
    // Interpret provided date/time as local wall-clock in Europe/Belgrade and convert to UTC.
    const dt = DateTime.fromISO(`${date}T${time}`, {
      zone: 'Europe/Belgrade',
    }).toUTC();
    return dt.toISO();
  }

  async function handleCreateTrip(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (
      !routeFrom ||
      !routeTo ||
      !departureDate ||
      !arrivalDate ||
      !companyId
    ) {
      setError('Please fill required fields');
      return;
    }

    try {
      // We first ensure route exists (backend route handler will create if missing, per your API)
      const departureIso = combineToUtcIso(departureDate, departureTime);
      const arrivalIso = combineToUtcIso(arrivalDate, arrivalTime);

      const payload = {
        fromId: undefined, // we don't have IDs on client; backend will find/create by names if you adapt
        toId: undefined,
        fromName: routeFrom,
        toName: routeTo,
        companyId,
        departure: departureIso,
        arrival: arrivalIso,
        seatsTotal,
      };

      const res = await fetch('/api/trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create trip');
      }

      setCreateOpen(false);
      await fetchTrips();
    } catch (err: any) {
      setError(err.message || 'Error creating trip');
    }
  }

  async function handleDeleteTrip(id: number) {
    if (!confirm('Da li ste sigurni da želite obrisati ovu vožnju?')) return;
    try {
      const res = await fetch('/api/trip', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete trip');
      await fetchTrips();
    } catch (err: any) {
      setError(err.message || 'Error');
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/company/logout', {
        method: 'POST',
        credentials: 'include',
      });
      // simple client redirect
      window.location.href = '/';
    } catch {
      window.location.href = '/';
    }
  }

  return (
    <div className="min-h-screen p-6 bg-slate-50">
      <header className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Company Admin</h2>
        <div className="flex items-center gap-3">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Trip
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Manage</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="text-sm">Trips ({trips.length})</li>
                <li className="text-sm">Routes</li>
                <li className="text-sm">Reservations</li>
                <li className="text-sm">Company Settings</li>
              </ul>
            </CardContent>
          </Card>
        </aside>

        <section className="col-span-1 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Trips</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading...</p>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="text-left">
                        <th className="p-2">ID</th>
                        <th className="p-2">Route</th>
                        <th className="p-2">Departure (local)</th>
                        <th className="p-2">Arrival (local)</th>
                        <th className="p-2">Seats</th>
                        <th className="p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trips.map((t) => {
                        const depLocal = DateTime.fromISO(t.departure)
                          .setZone('Europe/Belgrade')
                          .toFormat('yyyy-LL-dd HH:mm');
                        const arrLocal = DateTime.fromISO(t.arrival)
                          .setZone('Europe/Belgrade')
                          .toFormat('yyyy-LL-dd HH:mm');
                        return (
                          <tr key={t.id} className="border-t">
                            <td className="p-2">{t.id}</td>
                            <td className="p-2">
                              {t.route
                                ? `${t.route.from.name} → ${t.route.to.name}`
                                : `Route ${t.routeId}`}
                            </td>
                            <td className="p-2">{depLocal}</td>
                            <td className="p-2">{arrLocal}</td>
                            <td className="p-2">{t.seatsTotal}</td>
                            <td className="p-2 flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteTrip(t.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Create Trip Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Create Trip</h3>
            <form
              onSubmit={handleCreateTrip}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <Label>From (city name)</Label>
                <Input
                  value={routeFrom}
                  onChange={(e) => setRouteFrom(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>To (city name)</Label>
                <Input
                  value={routeTo}
                  onChange={(e) => setRouteTo(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Departure date</Label>
                <Input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Departure time</Label>
                <Input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Arrival date</Label>
                <Input
                  type="date"
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Arrival time</Label>
                <Input
                  type="time"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Company ID</Label>
                <Input
                  type="number"
                  value={companyId ?? ''}
                  onChange={(e) => setCompanyId(Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <Label>Seats total</Label>
                <Input
                  type="number"
                  value={seatsTotal}
                  onChange={(e) => setSeatsTotal(Number(e.target.value))}
                  required
                />
              </div>

              <div className="col-span-2 flex justify-end gap-2 mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
