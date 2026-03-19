export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const data = await request.json();
    const { from_name, from_email, phone, app_interest, meeting_type, booking_date, booking_time, message } = data;

    const BREVO_API_KEY = env.BREVO_API_KEY;

    if (!BREVO_API_KEY) {
      console.error("BREVO_API_KEY is not set in environment variables.");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Send notification to Studio88 Team
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Studio88 AI Booking", email: "bookings@studio88.ai" }, // Change this to a verified sender if needed
        to: [{ email: "afrowave.production@gmail.com", name: "Studio88 Team" }],
        subject: `New Booking: ${from_name}`,
        htmlContent: `
          <h1>New Discovery Call Booking</h1>
          <p><strong>Name:</strong> ${from_name}</p>
          <p><strong>Email:</strong> ${from_email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>App Interest:</strong> ${app_interest}</p>
          <p><strong>Meeting Type:</strong> ${meeting_type}</p>
          <p><strong>Date:</strong> ${booking_date}</p>
          <p><strong>Time:</strong> ${booking_time}</p>
          <p><strong>Brief:</strong> ${message}</p>
        `,
        replyTo: { email: from_email, name: from_name },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Brevo API error:", errorData);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Send confirmation to Client
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Studio88 AI", email: "hello@studio88.ai" },
        to: [{ email: from_email, name: from_name }],
        subject: "Your Studio88 AI Call is Confirmed ✅",
        htmlContent: `
          <h1>Booking Confirmed!</h1>
          <p>Hi ${from_name},</p>
          <p>Your discovery call is confirmed for <strong>${booking_date} at ${booking_time}</strong>.</p>
          <p>We'll talk soon!</p>
          <p>Best,<br>Studio88 AI Team</p>
        `,
      }),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Worker error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
