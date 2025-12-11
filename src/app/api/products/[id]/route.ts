import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const productUpdateSchema = z.object({
    name: z.string().min(1, "商品名は必須です").max(200).optional(),
    description: z.string().optional(),
    unitPrice: z.number().min(0, "単価は0以上である必要があります").optional(),
    taxType: z.enum(["INCLUSIVE", "EXCLUSIVE"]).optional(),
    taxRate: z.number().min(0).max(100).optional(),
    withholdingTaxTarget: z.boolean().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    freelancerId: z.string().nullable().optional(),
});

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                freelancer: {
                    select: { name: true }
                }
            }
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error("Failed to fetch product:", error);
        return NextResponse.json(
            { error: "Failed to fetch product" },
            { status: 500 }
        );
    }
}

export async function PUT(
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

    try {
        const json = await request.json();
        const body = productUpdateSchema.parse(json);

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: body as any,
        });

        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: "PRODUCT_UPDATE",
                details: `Updated product: ${updatedProduct.name}`
            }
        });

        return NextResponse.json(updatedProduct);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation Error", details: (error as any).errors },
                { status: 400 }
            );
        }
        console.error("Failed to update product:", error);
        return NextResponse.json(
            { error: "Failed to update product" },
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

    try {
        // Soft delete: Update status to INACTIVE
        await prisma.product.update({
            where: { id },
            data: { status: "INACTIVE" }
        });

        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: "PRODUCT_DELETE",
                details: `Deactivated product ID: ${id}`
            }
        });

        return NextResponse.json({ message: "Product deactivated successfully" });
    } catch (error) {
        console.error("Failed to deactivate product:", error);
        return NextResponse.json(
            { error: "Failed to deactivate product" },
            { status: 500 }
        );
    }
}
