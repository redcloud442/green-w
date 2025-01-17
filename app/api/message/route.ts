import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" });
  }

  const { number, message, sendername } = await req.json();

  if (!number || !message) {
    return NextResponse.json({
      error: "Missing required parameters: number or message",
    });
  }

  try {
    const response = await fetch("https://api.semaphore.co/api/v4/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apikey: process.env.SEMAPHORE_API_KEY, // Add your Semaphore API key to .env.local
        number,
        message,
        sendername: sendername || "Elevate Team", // Defaults to "SEMAPHORE" if not provided
      }),
    });

    // Read response body as text
    const rawBody = await response.text();

    // Try to parse as JSON
    let parsedBody;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      parsedBody = rawBody; // If not JSON, fallback to plain text
    }

    if (!response.ok) {
      return NextResponse.json({ error: parsedBody });
    }

    return NextResponse.json({ success: true, data: parsedBody });
  } catch (error) {
    console.error("Error sending SMS:", error);
    return NextResponse.json({ error: "Internal Server Error" });
  }
}
