/* ═══════════════════════════════════════════════════
   STUDIO88 AI — CLOUDFLARE WORKER
   Handles booking API + serves static assets
   ═══════════════════════════════════════════════════ */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ── API Routes ────────────────────────────────────
    if (url.pathname === '/api/book' && request.method === 'POST') {
      return handleBooking(request, env);
    }

    // ── CORS preflight ────────────────────────────────
    if (url.pathname === '/api/book' && request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // ── Serve static assets for everything else ───────
    return env.ASSETS.fetch(request);
  },
};


/* ─── Booking Handler ────────────────────────────────── */
async function handleBooking(request, env) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const data = await request.json();
    const { from_name, from_email, phone, app_interest, meeting_type, booking_date, booking_time, message } = data;

    const BREVO_API_KEY = env.BREVO_API_KEY;

    if (!BREVO_API_KEY) {
      console.error('BREVO_API_KEY is not set.');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500, headers });
    }

    // ── 1. Team Notification ──────────────────────────
    const teamEmail = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Studio88 AI Bookings', email: 'afrowave.production@gmail.com' },
        to: [{ email: 'afrowave.production@gmail.com', name: 'Studio88 Team' }],
        subject: `🗓️ New Booking: ${from_name}`,
        htmlContent: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0d1117; color: #d4d4d8; padding: 32px; border-radius: 12px;">
            <h1 style="color: #7c3aed; margin-bottom: 24px;">New Discovery Call Booking</h1>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #9ca3af;">Name</td><td style="padding: 8px 0; font-weight: 600;">${from_name}</td></tr>
              <tr><td style="padding: 8px 0; color: #9ca3af;">Email</td><td style="padding: 8px 0;"><a href="mailto:${from_email}" style="color: #60a5fa;">${from_email}</a></td></tr>
              <tr><td style="padding: 8px 0; color: #9ca3af;">Phone</td><td style="padding: 8px 0;">${phone}</td></tr>
              <tr><td style="padding: 8px 0; color: #9ca3af;">Project</td><td style="padding: 8px 0; color: #a78bfa; font-weight: 600;">${app_interest}</td></tr>
              <tr><td style="padding: 8px 0; color: #9ca3af;">Meeting</td><td style="padding: 8px 0;">${meeting_type}</td></tr>
              <tr><td style="padding: 8px 0; color: #9ca3af;">Date</td><td style="padding: 8px 0; font-weight: 600;">${booking_date}</td></tr>
              <tr><td style="padding: 8px 0; color: #9ca3af;">Time</td><td style="padding: 8px 0; font-weight: 600;">${booking_time}</td></tr>
            </table>
            <div style="margin-top: 20px; padding: 16px; background: #1a1a2e; border-radius: 8px;">
              <p style="color: #9ca3af; margin: 0 0 8px 0;">Brief:</p>
              <p style="margin: 0;">${message}</p>
            </div>
          </div>
        `,
        replyTo: { email: from_email, name: from_name },
      }),
    });

    if (!teamEmail.ok) {
      const errorData = await teamEmail.json();
      console.error('Brevo team email error:', errorData);
      return new Response(JSON.stringify({ error: 'Failed to send notification email' }), { status: 500, headers });
    }

    // ── 2. Client Confirmation ────────────────────────
    const clientEmail = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Studio88 AI', email: 'afrowave.production@gmail.com' },
        to: [{ email: from_email, name: from_name }],
        subject: 'Your Studio88 AI Call is Confirmed ✅',
        htmlContent: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0d1117; color: #d4d4d8; padding: 32px; border-radius: 12px;">
            <h1 style="color: #7c3aed;">Booking Confirmed! ✅</h1>
            <p>Hi ${from_name},</p>
            <p>Your discovery call has been confirmed:</p>
            <div style="background: #1a1a2e; padding: 20px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 4px 0;"><strong>📅 Date:</strong> ${booking_date}</p>
              <p style="margin: 4px 0;"><strong>⏰ Time:</strong> ${booking_time}</p>
              <p style="margin: 4px 0;"><strong>🖥️ Type:</strong> ${meeting_type}</p>
              <p style="margin: 4px 0;"><strong>🎯 Project:</strong> ${app_interest}</p>
            </div>
            <p>We look forward to speaking with you!</p>
            <p style="color: #9ca3af;">— The Studio88 AI Team</p>
          </div>
        `,
      }),
    });

    if (!clientEmail.ok) {
      console.error('Brevo client email error:', await clientEmail.text());
      // Don't fail the whole request — the team already received their notification
    }

    return new Response(JSON.stringify({ success: true }), { headers });

  } catch (error) {
    console.error('Worker booking error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers });
  }
}
