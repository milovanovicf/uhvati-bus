import { Resend } from 'resend';
import { DateTime } from 'luxon';

const resend = new Resend(process.env.RESEND_API_KEY);

interface TripDetails {
  bookingRef: string;
  fromCity: string;
  toCity: string;
  departure: Date;
  arrival: Date;
  companyName: string;
  seats: number[];
  viewCancelUrl: string;
}

interface BookingEmailData {
  to: string;
  fullName: string;
  outbound: TripDetails;
  returnTrip?: TripDetails;
  returnBookingUrl?: string;
}

function formatDateTime(date: Date) {
  return DateTime.fromJSDate(date)
    .setZone('Europe/Belgrade')
    .setLocale('sr-Latn')
    .toFormat("d. LLL yyyy 'u' HH:mm");
}

function formatTime(date: Date) {
  return DateTime.fromJSDate(date).setZone('Europe/Belgrade').toFormat('HH:mm');
}

function tripBlock(trip: TripDetails, label: string): string {
  return `
    <tr>
      <td style="padding:0 32px 24px;">
        <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">${label}</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;">
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
              <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Referentni broj</p>
              <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#1e3a8a;letter-spacing:0.08em;">${trip.bookingRef}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
              <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Prevoznik</p>
              <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:600;">${trip.companyName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
              <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Ruta</p>
              <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:600;">${trip.fromCity} → ${trip.toCity}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
              <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Polazak</p>
              <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:600;">${formatDateTime(trip.departure)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
              <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Dolazak</p>
              <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:600;">${formatTime(trip.arrival)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 16px;">
              <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Sedišta (${trip.seats.length})</p>
              <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:600;">${trip.seats.join(', ')}</p>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
          <tr>
            <td>
              <a href="${trip.viewCancelUrl}"
                 style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:6px;font-size:14px;font-weight:600;">
                Upravljaj rezervacijom →
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding-top:8px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">Promenite datum ili otkažite rezervaciju.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function buildHtml(data: BookingEmailData): string {
  const { fullName, outbound, returnTrip, returnBookingUrl } = data;
  const isRoundTrip = !!returnTrip;
  const subject = isRoundTrip ? 'Povratna karta' : 'Potvrda rezervacije';

  return `<!DOCTYPE html>
<html lang="sr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:#1d4ed8;padding:28px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">UhvatiBus</h1>
              <p style="margin:4px 0 0;color:#93c5fd;font-size:14px;">${subject}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px 20px;">
              <p style="margin:0;font-size:16px;color:#111827;">Poštovani/a <strong>${fullName}</strong>,</p>
              <p style="margin:8px 0 0;font-size:15px;color:#374151;">
                ${isRoundTrip
                  ? 'Vaša povratna karta je uspešno rezervisana. Čuvajte ovaj email i pokažite ga vozaču pri ukrcavanju.'
                  : 'Vaša rezervacija je uspešno kreirana. Čuvajte ovaj email i pokažite ga vozaču pri ukrcavanju.'}
              </p>
            </td>
          </tr>

          ${tripBlock(outbound, isRoundTrip ? 'Polazak' : 'Detalji putovanja')}
          ${returnTrip ? tripBlock(returnTrip, 'Povratak') : ''}

          ${!isRoundTrip && returnBookingUrl ? `
          <tr>
            <td style="padding:0 32px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:14px;color:#9a3412;font-weight:600;">Rezervišite povratnu kartu</p>
                    <p style="margin:6px 0 8px;font-size:13px;color:#c2410c;">Dodajte povratno putovanje kada budete spremni.</p>
                    <a href="${returnBookingUrl}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:13px;font-weight:600;">
                      Rezerviši povratak →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : ''}

          <tr>
            <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:13px;color:#6b7280;text-align:center;">
                UhvatiBus — platforma za rezervaciju autobuskih karata u Srbiji
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendVerificationCode(
  to: string,
  companyName: string,
  code: string,
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping verification email');
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="sr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#1d4ed8;padding:28px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">UhvatiBus</h1>
              <p style="margin:4px 0 0;color:#93c5fd;font-size:14px;">Verifikacija naloga</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0;font-size:16px;color:#111827;">Poštovani/a <strong>${companyName}</strong>,</p>
              <p style="margin:12px 0 0;font-size:15px;color:#374151;">Unesite sledeći kod da biste verifikovali svoju email adresu. Kod važi <strong>15 minuta</strong>.</p>
              <div style="margin:28px 0;text-align:center;">
                <span style="display:inline-block;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px 32px;font-size:36px;font-weight:700;color:#1e3a8a;letter-spacing:0.15em;">${code}</span>
              </div>
              <p style="margin:0;font-size:13px;color:#6b7280;">Ako niste vi kreirali nalog na UhvatiBus platformi, možete ignorisati ovaj email.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:13px;color:#6b7280;text-align:center;">UhvatiBus — platforma za rezervaciju autobuskih karata u Srbiji</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const { error } = await resend.emails.send({
      from: 'UhvatiBus <onboarding@resend.dev>',
      to,
      subject: 'UhvatiBus — verifikacija email adrese',
      html,
    });
    if (error) console.error('Resend error:', error);
  } catch (err) {
    console.error('Failed to send verification email:', err);
  }
}

export async function sendBookingConfirmation(data: BookingEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping confirmation email');
    return;
  }

  const { outbound, returnTrip } = data;
  const subject = returnTrip
    ? `Povratna karta ${outbound.bookingRef} / ${returnTrip.bookingRef} — ${outbound.fromCity} → ${outbound.toCity}`
    : `Potvrda rezervacije ${outbound.bookingRef} — ${outbound.fromCity} → ${outbound.toCity}`;

  try {
    const { error } = await resend.emails.send({
      from: 'UhvatiBus <onboarding@resend.dev>',
      to: data.to,
      subject,
      html: buildHtml(data),
    });
    if (error) console.error('Resend error:', error);
  } catch (err) {
    console.error('Failed to send booking confirmation email:', err);
  }
}
