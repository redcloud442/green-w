import { rateLimit } from "@/utils/redis/redis";
import { protectionAdminUser } from "@/utils/serversideProtection";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { profile } = await protectionAdminUser();

    const isAllowed = await rateLimit(`rate-limit:${profile?.user_id}`, 10, 60);
    if (!isAllowed) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Parse and validate the request body
    const { number, message } = await req.json();
    if (!Array.isArray(number) || number.length === 0) {
      return NextResponse.json(
        { error: "Number must be a non-empty array." },
        { status: 400 }
      );
    }
    if (typeof message !== "string" || message.trim() === "") {
      return NextResponse.json(
        { error: "Message must be a non-empty string." },
        { status: 400 }
      );
    }

    const apiKey = process.env.MOVIDER_API_KEY!;
    const apiSecret = process.env.MOVIDER_API_SECRET!;

    // Format the numbers to E.164 and join them with commas
    const formattedNumbers = number
      .map((num) => {
        // Remove any non-digit characters except "+"
        const cleaned = num.replace(/[^0-9+]/g, "").trim();

        return cleaned;
      })
      .filter((num) => /^\+\d{10,15}$/.test(num)) // Validate E.164 format
      .join(",");

    if (!formattedNumbers) {
      return NextResponse.json(
        { error: "No valid numbers provided." },
        { status: 400 }
      );
    }

    const bodyParams = new URLSearchParams();
    bodyParams.append("to", formattedNumbers);
    bodyParams.append("text", message);
    bodyParams.append("api_key", apiKey);
    bodyParams.append("api_secret", apiSecret);

    // Send the request to the Movider API
    const response = await fetch("https://api.movider.co/v1/sms", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString(
          "base64"
        )}`,
      },
      body: bodyParams.toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: result.message || "Failed to send SMS" },
        { status: response.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
