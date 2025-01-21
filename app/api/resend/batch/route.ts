import { rateLimit } from "@/utils/redis/redis";
import { protectionAdminUser } from "@/utils/serversideProtection";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    const { batchData } = await req.json();

    if (!batchData || !Array.isArray(batchData) || batchData.length === 0) {
      return NextResponse.json(
        { error: "Invalid batch data. Ensure 'batchData' is an array." },
        { status: 400 }
      );
    }

    const emails = batchData.map((email) => ({
      to: email.to,
      from: email.from,
      subject: email.subject,
      html: email.html, // Use the HTML field here
    }));

    const { data, error } = await resend.batch.send(emails);

    if (error) {
      return NextResponse.json(error, { status: 500 });
    }

    return NextResponse.json({
      message: "Batch emails sent successfully",
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error processing batch email request" },
      { status: 500 }
    );
  }
}
