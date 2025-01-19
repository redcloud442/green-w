import { rateLimit } from "@/utils/redis/redis";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("cf-connecting-ip") ||
    "unknown";

  const isAllowed = await rateLimit(`rate-limit:${ip}`, 5, 60);

  if (!isAllowed) {
    return sendErrorResponse("Too many requests. Please try again later.", 429);
  }
  return NextResponse.json({ status: "OK" }, { status: 200 });
}
function sendErrorResponse(arg0: string, arg1: number) {
  throw new Error("Function not implemented.");
}
