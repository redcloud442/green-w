import { applyRateLimit } from "@/utils/function";
import prisma from "@/utils/prisma";
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

    await applyRateLimit(teamMemberProfile?.alliance_member_id || "", ip);

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
