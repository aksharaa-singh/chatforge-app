import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { isExpired } from "@/lib/tokens";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").toLowerCase();
    const token = String(body.token || "");

    if (!email || !token) {
      return NextResponse.json(
        { error: "Verification link is missing required information." },
        { status: 400 }
      );
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        token,
      },
    });

    if (
      !verificationToken ||
      verificationToken.identifier.toLowerCase() !== email
    ) {
      return NextResponse.json(
        { error: "This verification link is invalid or has already been used." },
        { status: 400 }
      );
    }

    if (isExpired(verificationToken.expires)) {
      await prisma.verificationToken.delete({
        where: {
          token,
        },
      });

      return NextResponse.json(
        { error: "This verification link has expired. Please sign up again." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: {
        email,
      },
      data: {
        emailVerified: new Date(),
      },
    });

    await prisma.verificationToken.delete({
      where: {
        token,
      },
    });

    return NextResponse.json({
      message: "Email verified successfully. You can now sign in.",
    });
  } catch (error) {
    console.error("Verify email error:", error);

    return NextResponse.json(
      { error: "Something went wrong while verifying your email." },
      { status: 500 }
    );
  }
}