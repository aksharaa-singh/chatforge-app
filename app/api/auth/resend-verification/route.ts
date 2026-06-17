import { NextResponse } from "next/server";

import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { createExpiryDate, createToken } from "@/lib/tokens";
import { resendVerificationSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resendVerificationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid email." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        emailVerified: true,
      },
    });

    if (!user || user.emailVerified) {
      return NextResponse.json({
        message:
          "If this email needs verification, a ChatForge verification email has been sent.",
      });
    }

    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    const token = createToken();
    const expires = createExpiryDate(24);

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    const verificationUrl = new URL("/verify-email", process.env.NEXTAUTH_URL);
    verificationUrl.searchParams.set("email", email);
    verificationUrl.searchParams.set("token", token);

    const emailResult = await sendVerificationEmail({
      to: email,
      verificationUrl: verificationUrl.toString(),
    });

    return NextResponse.json({
      message: emailResult.sent
        ? "If this email needs verification, a ChatForge verification email has been sent."
        : "If this email needs verification, a ChatForge verification link has been prepared.",
      verificationUrl: emailResult.sent ? undefined : verificationUrl.toString(),
    });
  } catch (error) {
    console.error("Resend verification error:", error);

    return NextResponse.json(
      { error: "Something went wrong while sending the verification email." },
      { status: 500 }
    );
  }
}
