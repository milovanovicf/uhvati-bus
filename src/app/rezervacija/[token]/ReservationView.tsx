'use client';

import { useState, useTransition } from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cancelReservation } from '@/app/actions';
import { useTranslation } from '@/lib/i18n/LanguageContext';

type Reservation = {
  bookingRef: string | null;
  trip: { departure: Date };
};

interface Props {
  reservation: Reservation | null;
  invalidReason?: 'invalid_token' | 'not_found';
  token: string;
}

export default function ReservationView({ reservation, invalidReason, token }: Props) {
  const { t } = useTranslation();
  const [cancelled, setCancelled] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isPastTrip = reservation
    ? new Date(reservation.trip.departure) < new Date()
    : false;

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelReservation(token);
      if (result.success) {
        setCancelled(true);
      } else if (result.error === 'already_departed') {
        setCancelError(t('myReservation.alreadyDeparted'));
      } else {
        setCancelError(t('myReservation.cancelError'));
      }
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <a href="/">
            <img src="/logo/logo-big.png" alt="UhvatiBus" className="h-10 mx-auto" />
          </a>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          {/* Invalid / not found */}
          {!reservation && (
            <>
              <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                {t('myReservation.invalidTitle')}
              </h1>
              <p className="text-gray-500 text-sm">
                {invalidReason === 'not_found'
                  ? t('myReservation.notFoundMsg')
                  : t('myReservation.invalidMsg')}
              </p>
            </>
          )}

          {/* Cancelled */}
          {reservation && cancelled && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                {t('myReservation.cancelledTitle')}
              </h1>
              <p className="text-gray-500 text-sm">{t('myReservation.cancelledMsg')}</p>
            </>
          )}

          {/* Cancel prompt */}
          {reservation && !cancelled && (
            <>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {reservation.bookingRef}
              </p>

              {cancelError && (
                <div className="flex items-start gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-left">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  {cancelError}
                </div>
              )}

              {isPastTrip ? (
                <p className="text-sm text-gray-400">{t('myReservation.alreadyDeparted')}</p>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={handleCancel}
                  disabled={isPending}
                >
                  {isPending ? t('myReservation.cancelling') : t('myReservation.cancelBtn')}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
