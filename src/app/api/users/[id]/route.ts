import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateUserSchema = z.object({
    username: z.string().min(1, "ユーザー名は必須です").optional(),
    email: z.string().email("有効なメールアドレスを入力してください").optional(),
    password: z.string().min(8, "パスワードは8文字以上必要です").optional().or(z.literal("")),
    role: z.enum(["COMPANY", "FREELANCER"]).optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]).optional(),
});

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    // Allow users to update their own profile (e.g. password) or COMPANY admin to update anyone
    if (session.user.role !== "COMPANY" && session.user.id !== id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const json = await request.json();
        const body = updateUserSchema.parse(json);
        const data: any = { ...body };

        if (body.password) {
            data.passwordHash = await bcrypt.hash(body.password, 10);
            delete data.password;
        } else {
            delete data.password;
        }

        // Role and Status changes should only be allowed by COMPANY
        if (session.user.role !== "COMPANY") {
            delete data.role;
            delete data.status;
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: data,
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                status: true,
                updatedAt: true
            }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation Error", details: (error as any).errors },
                { status: 400 }
            );
        }
        console.error("Failed to update user:", error);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "COMPANY") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    // Prevent deleting self
    if (session.user.id === id) {
        return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    try {
        await prisma.user.delete({
            where: { id },
        });
        return NextResponse.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Failed to delete user:", error);
        return NextResponse.json(
            { error: "Failed to delete user" },
            { status: 500 }
        );
    }
}
