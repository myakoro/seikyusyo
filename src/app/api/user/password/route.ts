import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "現在のパスワードは必須です"),
    newPassword: z.string().min(8, "新しいパスワードは8文字以上で入力してください"),
    confirmPassword: z.string().min(1, "パスワード(確認)は必須です"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "新しいパスワードが一致しません",
    path: ["confirmPassword"],
});

export async function PUT(request: Request) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const json = await request.json();
        const body = passwordSchema.parse(json);

        // Get user to check current password
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Verify current password
        const isValid = await bcrypt.compare(body.currentPassword, user.passwordHash);
        if (!isValid) {
            return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(body.newPassword, 10);

        // Update user
        await prisma.user.update({
            where: { id: session.user.id },
            data: { passwordHash: hashedPassword }
        });

        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: "PASSWORD_CHANGE",
                details: "User changed password"
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation Error", details: (error as any).errors }, { status: 400 });
        }
        console.error("Failed to update password:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
