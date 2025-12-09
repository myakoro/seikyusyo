import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Schema for company info validation
const companyInfoSchema = z.object({
    companyName: z.string().min(1, "会社名は必須です").max(200),
    postalCode: z.string().regex(/^\d{7}$/, "郵便番号は7桁の数字です").optional(),
    address: z.string().max(500).optional(),
    phone: z.string().max(20).optional(),
    email: z.string().email("有効なメールアドレスを入力してください").optional().or(z.literal("")),
    additionalInfo: z.string().max(1000).optional(),
});

export async function GET() {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const companyInfo = await prisma.companyInfo.findFirst();
        return NextResponse.json(companyInfo || {});
    } catch (error) {
        console.error("Failed to fetch company info:", error);
        return NextResponse.json(
            { error: "Failed to fetch company info" },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only COMPANY role usually edits this, but specific requirement isn't strict yet.
    // Assuming minimal RBAC: any authenticated user for now, or strict "COMPANY" role check if needed.
    if (session.user.role !== "COMPANY" && session.user.role !== "ADMIN") {
        // Note: role might differ based on setup. Default schema has "COMPANY" or "FREELANCER".
        // Let's assume only COMPANY role can edit.
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const json = await request.json();
        const body = companyInfoSchema.parse(json);

        const existing = await prisma.companyInfo.findFirst();

        if (existing) {
            const updated = await prisma.companyInfo.update({
                where: { id: existing.id },
                data: body,
            });
            return NextResponse.json(updated);
        } else {
            const created = await prisma.companyInfo.create({
                data: body,
            });
            return NextResponse.json(created);
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation Error", details: error.errors },
                { status: 400 }
            );
        }
        console.error("Failed to update company info:", error);
        return NextResponse.json(
            { error: "Failed to update company info" },
            { status: 500 }
        );
    }
}
