import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const freelancerUpdateSchema = z.object({
    name: z.string().min(1, "氏名は必須です").max(200).optional(),
    nameKana: z.string().max(200).optional().or(z.literal("")),
    email: z.string().email("有効なメールアドレスを入力してください").optional(),
    phone: z.string().min(1, "電話番号は必須です").max(20).optional(),
    postalCode: z.string().regex(/^\d{7}$/, "郵便番号は7桁の数字です").optional(),
    address: z.string().min(1, "住所は必須です").optional(),
    invoiceNumber: z.string().regex(/^T\d{13}$/, "適格請求書登録番号はT+13桁の数字です").optional().or(z.literal("")),
    bankName: z.string().min(1, "銀行名は必須です").optional(),
    bankBranch: z.string().min(1, "支店名は必須です").optional(),
    accountType: z.enum(["ORDINARY", "CURRENT", "SAVINGS"]).optional(),
    accountNumber: z.string().min(1, "口座番号は必須です").max(20).optional(),
    accountHolder: z.string().min(1, "口座名義は必須です").optional(),
    withholdingTaxDefault: z.boolean().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const freelancer = await prisma.freelancer.findUnique({
            where: { id: params.id },
            include: {
                products: true, // Include products if needed
            }
        });

        if (!freelancer) {
            return NextResponse.json({ error: "Freelancer not found" }, { status: 404 });
        }

        return NextResponse.json(freelancer);
    } catch (error) {
        console.error("Failed to fetch freelancer:", error);
        return NextResponse.json(
            { error: "Failed to fetch freelancer" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "COMPANY") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const json = await request.json();
        const body = freelancerUpdateSchema.parse(json);

        // Convert empty strings to null for nullable fields
        const data: any = { ...body };
        if (body.nameKana === "") data.nameKana = null;
        if (body.invoiceNumber === "") data.invoiceNumber = null;

        const updatedFreelancer = await prisma.freelancer.update({
            where: { id: params.id },
            data: data,
        });

        return NextResponse.json(updatedFreelancer);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation Error", details: error.errors },
                { status: 400 }
            );
        }
        console.error("Failed to update freelancer:", error);
        return NextResponse.json(
            { error: "Failed to update freelancer" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "COMPANY") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await prisma.freelancer.delete({
            where: { id: params.id },
        });
        return NextResponse.json({ message: "Freelancer deleted successfully" });
    } catch (error: any) {
        // Check for foreign key constraint violation
        if (error.code === 'P2003') {
            return NextResponse.json(
                { error: "Cannot delete freelancer because they have associated records (invoices or products)." },
                { status: 409 }
            );
        }
        console.error("Failed to delete freelancer:", error);
        return NextResponse.json(
            { error: "Failed to delete freelancer" },
            { status: 500 }
        );
    }
}
