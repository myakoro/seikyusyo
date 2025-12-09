import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

const userSchema = z.object({
    username: z.string().min(1, "ユーザー名は必須です"),
    email: z.string().email("有効なメールアドレスを入力してください"),
    password: z.string().min(8, "パスワードは8文字以上必要です").optional(), // Optional on update
    role: z.enum(["COMPANY", "FREELANCER"]),
    status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]).default("ACTIVE"),
});

export async function GET() {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only COMPANY role can view all users
    if (session.user.role !== "COMPANY") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(users);
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    // Allow unauthenticated creation for initial setup? Or strictly authenticated?
    // Usually, creating users requires auth. But for the very first user, we might need a seed script.
    // Assuming auth is required here.
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "COMPANY") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const json = await request.json();
        // For creation, password is required
        const body = userSchema.extend({ password: z.string().min(8) }).parse(json);

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: body.email },
                    { username: body.username }
                ]
            }
        });

        if (existingUser) {
            return NextResponse.json({ error: "User already exists" }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(body.password, 10);

        const newUser = await prisma.user.create({
            data: {
                username: body.username,
                email: body.email,
                passwordHash: hashedPassword,
                role: body.role,
                status: body.status,
            },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation Error", details: error.errors },
                { status: 400 }
            );
        }
        console.error("Failed to create user:", error);
        return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500 }
        );
    }
}
