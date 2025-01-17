import { applyRateLimit } from "@/utils/function";
import prisma from "@/utils/prisma";
import { protectionAdminUser } from "@/utils/serversideProtection";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Helper functions for responses
const errorResponse = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

const successResponse = (data: object = {}) =>
  NextResponse.json({ success: true, ...data });

const updatePackageSchema = z.object({
  packageName: z.string().min(3),
  packageDescription: z.string().min(3),
  packagePercentage: z.number().min(1),
  packageDays: z.number().min(1),
  packageIsDisabled: z.boolean(),
  packageColor: z.string().min(3),
  package_image: z.string().min(3),
});

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ packageId: string }> }
) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    const { packageId } = await context.params;
    if (!packageId) return errorResponse("Package ID is required.", 400);

    const { packageData, teamMemberId } = await request.json();

    const validate = updatePackageSchema.safeParse(packageData);

    if (!validate.success) {
      throw new Error(validate.error.message);
    }

    const {
      packageName,
      packageDescription,
      packagePercentage,
      packageDays,
      packageIsDisabled,
      packageColor,
      package_image,
    } = packageData;

    if (
      !packageName ||
      !packageDescription ||
      !packagePercentage ||
      !packageDays
    ) {
      return errorResponse("All package fields are required.", 400);
    }

    const { teamMemberProfile } = await protectionAdminUser(ip);
    if (!teamMemberProfile)
      return errorResponse("User authentication failed.", 401);

    if (
      teamMemberProfile.alliance_member_id !== teamMemberId &&
      teamMemberProfile.alliance_member_role !== "ADMIN"
    ) {
      return errorResponse(
        "You are not authorized to update this package.",
        403
      );
    }

    await applyRateLimit(teamMemberProfile.alliance_member_id, ip);

    const updatedPackage = await prisma.$transaction(async (tx) => {
      return await tx.package_table.update({
        where: { package_id: packageId },
        data: {
          package_name: packageName,
          package_description: packageDescription,
          package_percentage: parseFloat(packagePercentage),
          packages_days: parseInt(packageDays),
          package_is_disabled: packageIsDisabled,
          package_color: packageColor ? packageColor : undefined,
          package_image: package_image ? package_image : undefined,
        },
      });
    });

    return successResponse(updatedPackage);
  } catch (error) {
    return errorResponse("Internal Server Error.", 500);
  }
}
