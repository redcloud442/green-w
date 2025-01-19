import prisma from "@/utils/prisma";
import { rateLimit } from "@/utils/redis/redis";
import { protectionAdminUser } from "@/utils/serversideProtection";
import { NextResponse } from "next/server";
import { z } from "zod";

const createPackageSchema = z.object({
  packageName: z.string().min(3),
  packageDescription: z.string().min(3),
  packagePercentage: z.number().min(1),
  packageDays: z.number().min(1),
});

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    const body = await request.json();

    const validate = createPackageSchema.safeParse(body);

    if (!validate.success) {
      throw new Error(validate.error.message);
    }

    if (!body) {
      return NextResponse.json(
        { error: "Request body is empty or invalid" },
        { status: 400 }
      );
    }

    const {
      packageName,
      packageDescription,
      packagePercentage,
      packageDays,
      packageColor,
      packageImage,
    } = body;

    if (
      !packageName ||
      !packageDescription ||
      !packagePercentage ||
      !packageDays ||
      !packageColor ||
      !packageImage
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { teamMemberProfile } = await protectionAdminUser(ip);

    if (!teamMemberProfile) {
      return NextResponse.json(
        { error: "Team member not found." },
        { status: 404 }
      );
    }

    const isAllowed = await rateLimit(
      `rate-limit:${teamMemberProfile.alliance_member_id}`,
      50,
      60
    );

    if (!isAllowed) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const checkIfPackageExists = await prisma.package_table.findFirst({
      where: { package_name: packageName },
    });

    if (checkIfPackageExists) {
      return NextResponse.json(
        { error: "Package already exists." },
        { status: 400 }
      );
    }

    const parsedPackagePercentage = parseFloat(packagePercentage);
    const parsedPackageDays = parseInt(packageDays, 10);

    if (isNaN(parsedPackagePercentage) || isNaN(parsedPackageDays)) {
      throw new Error(
        "Invalid number format for packagePercentage or packageDays."
      );
    }

    const result = await prisma.$transaction([
      prisma.package_table.create({
        data: {
          package_name: packageName,
          package_description: packageDescription,
          package_percentage: parsedPackagePercentage,
          packages_days: parsedPackageDays,
          package_color: packageColor,
          package_image: packageImage,
        },
      }),
    ]);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error." },
      { status: 500 }
    );
  }
}
