import { ROLE } from "@/utils/constant";
import { decryptData } from "@/utils/function";
import prisma from "@/utils/prisma";
import { rateLimit } from "@/utils/redis/redis";
import { NextResponse } from "next/server";
import { z } from "zod";

const sendErrorResponse = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

const getClientIP = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
  request.headers.get("cf-connecting-ip") ||
  "unknown";

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request);
    if (ip === "unknown")
      return sendErrorResponse(
        "Unable to determine IP address for rate limiting.",
        400
      );

    const isAllowed = await rateLimit(`rate-limit:${ip}`, 5, 60);

    if (!isAllowed) {
      return sendErrorResponse(
        "Too many requests. Please try again later.",
        429
      );
    }

    const {
      userName,
      password,
      role = "MEMBER",
      userProfile,
    } = await request.json();
    if (!userName || !password)
      return sendErrorResponse("Email and password are required.", 400);

    const loginData = LoginSchema.safeParse({
      userName,
      password,
    });

    if (!loginData.success) {
      return sendErrorResponse("Invalid request.", 400);
    }

    const user = await prisma.user_table.findFirst({
      where: {
        user_username: {
          equals: userName,
          mode: "insensitive",
        },
      },
      include: {
        alliance_member_table: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    if (userProfile && userProfile.alliance_member_restricted) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }
    // const banned = await prisma.user_history_log.findFirst({
    //   where: {
    //     user_history_user_id: user.user_id,
    //     user_ip_address: ip,
    //     alliance_member_table: {
    //       alliance_member_alliance_id: user.alliance_member_table[0]
    //         ?.alliance_member_alliance_id,
    //     },
    //   },
    // });

    // if (banned) {
    //   return sendErrorResponse("User is banned.", 403);
    // }

    const teamMemberProfile = user.alliance_member_table[0];

    if (!teamMemberProfile)
      return sendErrorResponse("User profile not found or incomplete.", 403);

    if (teamMemberProfile.alliance_member_restricted) {
      return sendErrorResponse("User is banned.", 403);
    }

    const decryptedPassword = await decryptData(
      user.user_password,
      user.user_iv ?? ""
    );
    if (role === ROLE.MEMBER && decryptedPassword !== password) {
      return sendErrorResponse("Password Incorrect", 401);
    }

    if (role === ROLE.ADMIN) {
      const decryptedInputPassword = await decryptData(
        password,
        user.user_iv ?? ""
      );
      if (decryptedInputPassword !== decryptedPassword) {
        return sendErrorResponse("Password Incorrect", 401);
      }
    }

    if (
      teamMemberProfile.alliance_member_restricted ||
      !teamMemberProfile.alliance_member_alliance_id
    ) {
      return sendErrorResponse("Access restricted or incomplete profile.", 403);
    }

    await prisma.$transaction([
      prisma.user_history_log.create({
        data: {
          user_ip_address: ip,
          user_history_user_id: user.user_id,
        },
      }),
    ]);

    const redirects: Record<string, string> = {
      MEMBER: "/",
      ADMIN: "/admin",
    };

    const redirect = redirects[teamMemberProfile.alliance_member_role] || "/";

    return NextResponse.json({ success: true, redirect });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Internal Server Error." },
      { status: 500 }
    );
  }
}

const LoginSchema = z.object({
  userName: z
    .string()
    .min(6, "Username must be at least 6 characters long")
    .max(20, "Username must be at most 20 characters long")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
});

export async function GET(request: Request) {
  try {
    const ip = getClientIP(request);
    if (ip === "unknown")
      return sendErrorResponse(
        "Unable to determine IP address for rate limiting.",
        400
      );

    const { searchParams } = new URL(request.url);
    const userName = searchParams.get("userName");

    const loginData = LoginSchema.safeParse({
      userName,
    });

    if (!loginData.success) {
      return NextResponse.json({ success: false, userName });
    }

    const isAllowed = await rateLimit(`rate-limit:${ip}`, 5, 60);

    if (!isAllowed) {
      return NextResponse.json({ success: false, userName });
    }

    const user = await prisma.user_table.findFirst({
      where: {
        user_username: {
          equals: userName,
          mode: "insensitive",
        },
      },
    });
    if (user) {
      return NextResponse.json({
        success: false,
        message: "Username already exists",
      });
    }

    return NextResponse.json({ success: true, userName });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error." },
      { status: 500 }
    );
  }
}
