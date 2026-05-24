import { Resend } from 'resend';
import { DateTime } from 'luxon';

const resend = new Resend(process.env.RESEND_API_KEY);

interface BookingEmailData {
  to: string;
  fullName: string;
  bookingRef: string;
  fromCity: string;
  toCity: string;
  departure: Date;
  arrival: Date;
  companyName: string;
  seats: number[];
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

function buildHtml(data: BookingEmailData): string {
  const {
    fullName,
    bookingRef,
    fromCity,
    toCity,
    departure,
    arrival,
    companyName,
    seats,
  } = data;

  return `<!DOCTYPE html>
<html lang="sr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1d4ed8;padding:28px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">UhvatiBus</h1>
              <p style="margin:4px 0 0;color:#93c5fd;font-size:14px;">Potvrda rezervacije</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:28px 32px 0;">
              <p style="margin:0;font-size:16px;color:#111827;">Poštovani/a <strong>${fullName}</strong>,</p>
              <p style="margin:8px 0 0;font-size:15px;color:#374151;">Vaša rezervacija je uspešno kreirana. Čuvajte ovaj email i pokažite ga vozaču pri ukrcavanju.</p>
            </td>
          </tr>

          <!-- Booking ref -->
          <tr>
            <td style="padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:12px;color:#1d4ed8;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Referentni broj rezervacije</p>
                    <p style="margin:6px 0 0;font-size:28px;font-weight:700;color:#1e3a8a;letter-spacing:0.08em;">${bookingRef}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Trip details -->
          <tr>
            <td style="padding:0 32px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Prevoznik</p>
                    <p style="margin:4px 0 0;font-size:15px;color:#111827;font-weight:600;">${companyName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Ruta</p>
                    <p style="margin:4px 0 0;font-size:15px;color:#111827;font-weight:600;">${fromCity} → ${toCity}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Polazak</p>
                    <p style="margin:4px 0 0;font-size:15px;color:#111827;font-weight:600;">${formatDateTime(departure)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Dolazak</p>
                    <p style="margin:4px 0 0;font-size:15px;color:#111827;font-weight:600;">${formatTime(arrival)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Sedišta (${seats.length})</p>
                    <p style="margin:4px 0 0;font-size:15px;color:#111827;font-weight:600;">${seats.join(', ')}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
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

export async function sendBookingConfirmation(
  data: BookingEmailData,
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping confirmation email');
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: 'UhvatiBus <onboarding@resend.dev>',
      to: data.to,
      subject: `Potvrda rezervacije ${data.bookingRef} — ${data.fromCity} → ${data.toCity}`,
      html: buildHtml(data),
    });
    if (error) console.error('Resend error:', error);
  } catch (err) {
    console.error('Failed to send booking confirmation email:', err);
  }
}
