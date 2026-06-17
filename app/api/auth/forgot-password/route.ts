import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { createExpiryDate, createToken } from "@/lib/tokens";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid email." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({
        message:
          "If an account exists for that email, a reset link has been prepared.",
      });
    }

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const token = createToken();
    const expires = createExpiryDate(1);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expires,
      },
    });

    const resetUrl = new URL("/reset-password", process.env.NEXTAUTH_URL);
    resetUrl.searchParams.set("token", token);

    const emailResult = await sendPasswordResetEmail({
      to: email,
      resetUrl: resetUrl.toString(),
    });

    return NextResponse.json({
      message: emailResult.sent
        ? "If an account exists for that email, a reset link has been sent."
        : "If an account exists for that email, a reset link has been prepared.",
      resetUrl: emailResult.sent ? undefined : resetUrl.toString(),
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return NextResponse.json(
      { error: "Something went wrong while preparing the reset link." },
      { status: 500 }
    );
  }
}
