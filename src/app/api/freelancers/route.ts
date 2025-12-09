import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

// Validation schema for creating a freelancer
// Note: Freelancer creation involves creating a User account AND a Freelancer profile.
const createFreelancerSchema = z.object({
    name: z.string().min(1, "氏名は必須です"),
    email: z.string().email("有効なメールアドレスを入力してください"),
    username: z.string().min(4, "ユーザー名は4文字以上で入力してください").regex(/^[a-zA-Z0-9_-]+$/, "ユーザー名は半角英数字、ハイフン、アンダースコアのみ使用可能です"),
    password: z.string().min(8, "パスワードは8文字以上で入力してください"),
    postalCode: z.string().regex(/^\d{3}-?\d{4}$/, "郵便番号の形式が正しくありません").optional().or(z.literal("")),
    address: z.string().optional(),
    phoneNumber: z.string().optional(),
    taxRegistrationNumber: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export async function GET(request: Request) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.user.role !== "COMPANY") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    try {
        const whereClause: any = {};
        if (status) {
            whereClause.status = status;
        }

        const freelancers = await prisma.freelancer.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        email: true,
                        username: true,
                        status: true // User status, distinct from Freelancer profile status?
                        // Usually they align, but let's just select it.
                    }
                }
            }
        });

        return NextResponse.json({ freelancers });
    } catch (error) {
        console.error("Failed to fetch freelancers:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.user.role !== "COMPANY") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const json = await request.json();
        const body = createFreelancerSchema.parse(json);

        // Check if email or username already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: body.email },
                    { username: body.username }
                ]
            }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Email or Username already exists" },
                { status: 409 }
            );
        }

        // Create User and Freelancer inside a transaction
        const hashedPassword = await bcrypt.hash(body.password, 10);

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    username: body.username,
                    email: body.email,
                    passwordHash: hashedPassword,
                    role: "FREELANCER",
                    status: "ACTIVE", // Initial user status
                }
            });

            const freelancer = await tx.freelancer.create({
                data: {
                    userId: user.id,
                    name: body.name,
                    postalCode: body.postalCode || null,
                    address: body.address || null,
                    phone: body.phoneNumber || null,
                    invoiceNumber: body.taxRegistrationNumber || null,
                    status: body.status,
                }
            });

            // Log action
            await tx.auditLog.create({
                data: {
                    userId: session.user.id,
                    action: "FREELANCER_CREATE",
                    details: `Created freelancer: ${body.name} (${user.email})`
                }
            });

            return freelancer;
        });

        return NextResponse.json(result, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation Error", details: (error as any).errors }, { status: 400 });
        }
        console.error("Failed to create freelancer:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
