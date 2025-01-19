import prisma from "@/utils/prisma";
import { rateLimit } from "@/utils/redis/redis";
import { protectionMemberUser } from "@/utils/serversideProtection";
import { package_table } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    const { teamMemberProfile } = await protectionMemberUser(ip);

    const isAllowed = await rateLimit(
      `rate-limit:${teamMemberProfile?.alliance_member_id}`,
      50,
      60
    );

    if (!isAllowed) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const data = await tx.package_table.findMany({
        select: {
          package_id: true,
          package_name: true,
          package_percentage: true,
          package_description: true,
          packages_days: true,
          package_color: true,
          package_image: true,
        },
      });
      return data;
    });

    const serializeBigInt = (data: package_table[]) =>
      JSON.parse(
        JSON.stringify(data, (key, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      );

    const serializedResult = serializeBigInt(result as package_table[]); // Type assertion to bypass type check temporarily

    return NextResponse.json({ success: true, data: serializedResult });
  } catch (error) {
    return NextResponse.json(
      { error: "internal server error" },
      { status: 500 }
    );
  }
}
