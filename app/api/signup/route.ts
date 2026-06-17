import { NextResponse } from "next/server";

import { sendVerificationEmail } from "@/lib/email";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createExpiryDate, createToken } from "@/lib/tokens";
import { signupSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid signup data." },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
      },
    });

    await prisma.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    });

    const verificationToken = createToken();
    const expires = createExpiryDate(24);

    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: verificationToken,
        expires,
      },
    });

    const verificationUrl = new URL("/verify-email", process.env.NEXTAUTH_URL);
    verificationUrl.searchParams.set("email", normalizedEmail);
    verificationUrl.searchParams.set("token", verificationToken);

    const emailResult = await sendVerificationEmail({
      to: normalizedEmail,
      verificationUrl: verificationUrl.toString(),
    });

    return NextResponse.json(
      {
        message: emailResult.sent
          ? "Account created successfully. Check your email to verify your ChatForge account."
          : "Account created successfully. Please verify your email before signing in.",
        verificationUrl: emailResult.sent ? undefined : verificationUrl.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);

    return NextResponse.json(
      { error: "Something went wrong while creating your account." },
      { status: 500 }
    );
  }
}
