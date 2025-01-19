import { applyRateLimitMember } from "@/utils/function";
import { createClientServerSide } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClientServerSide();

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) throw userError;

    applyRateLimitMember(userData.user.id);

    // Parse the request body
    const { number, message } = await req.json();

    // Validate input
    if (!number || !message) {
      return NextResponse.json(
        { error: "Number and message are required" },
        { status: 400 }
      );
    }
    const apiKey = process.env.MOVIDER_API_KEY!;
    const apiSecret = process.env.MOVIDER_API_SECRET!;

    const bodyParams = new URLSearchParams();
    bodyParams.append(
      "to",
      number.startsWith("09")
        ? `63${number.slice(1)}`
        : number.startsWith("63")
          ? number
          : `63${number}`
    );

    bodyParams.append("text", message);
    bodyParams.append("api_key", apiKey);
    bodyParams.append("api_secret", apiSecret);

    const response = await fetch("https://api.movider.co/v1/sms", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
      },
      body: bodyParams.toString(),
    });

    const result = await response.json();

    console.log(result);

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
