import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const freelancerSchema = z.object({
    name: z.string().min(1, "氏名は必須です").max(200),
    nameKana: z.string().max(200).optional().or(z.literal("")),
    email: z.string().email("有効なメールアドレスを入力してください"),
    phone: z.string().min(1, "電話番号は必須です").max(20),
    postalCode: z.string().regex(/^\d{7}$/, "郵便番号は7桁の数字です"),
    address: z.string().min(1, "住所は必須です"),
    invoiceNumber: z.string().regex(/^T\d{13}$/, "適格請求書登録番号はT+13桁の数字です").optional().or(z.literal("")),
    bankName: z.string().min(1, "銀行名は必須です"),
    bankBranch: z.string().min(1, "支店名は必須です"),
    accountType: z.enum(["ORDINARY", "CURRENT", "SAVINGS"]), // 普通、当座、貯蓄
    accountNumber: z.string().min(1, "口座番号は必須です").max(20),
    accountHolder: z.string().min(1, "口座名義は必須です"),
    withholdingTaxDefault: z.boolean().default(true),
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export async function GET() {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const freelancers = await prisma.freelancer.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(freelancers);
    } catch (error) {
        console.error("Failed to fetch freelancers:", error);
        return NextResponse.json(
            { error: "Failed to fetch freelancers" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only COMPANY role can create freelancers (unless we implement self-registration later)
    if (session.user.role !== "COMPANY") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const json = await request.json();
        const body = freelancerSchema.parse(json);

        // Check duplicate email
        const existing = await prisma.freelancer.findUnique({
            where: { email: body.email }
        });
        if (existing) {
            return NextResponse.json({ error: "Email already registered" }, { status: 409 });
        }

        const freelancer = await prisma.freelancer.create({
            data: {
                ...body,
                // If invoiceNumber is empty string, make it null for DB unique constraint/cleanliness if desired,
                // but schema.prisma doesn't enforce unique on invoice_number for freelancers (only invoices).
                // However, keeping empty strings as empty strings is fine if consistent.
                // Let's convert empty strings to null for nullable fields to be cleaner.
                nameKana: body.nameKana || null,
                invoiceNumber: body.invoiceNumber || null,
            },
        });

        return NextResponse.json(freelancer, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation Error", details: error.errors },
                { status: 400 }
            );
        }
        console.error("Failed to create freelancer:", error);
        return NextResponse.json(
            { error: "Failed to create freelancer" },
            { status: 500 }
        );
    }
}
