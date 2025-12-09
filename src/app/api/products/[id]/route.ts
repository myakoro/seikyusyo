import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const productUpdateSchema = z.object({
    name: z.string().min(1, "商品名は必須です").max(200).optional(),
    unitPrice: z.number().min(0, "単価は0以上である必要があります").optional(),
    taxType: z.enum(["INCLUSIVE", "EXCLUSIVE"]).optional(),
    taxRate: z.number().optional(),
    withholdingTaxTarget: z.boolean().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    displayOrder: z.number().int().optional(),
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
        const product = await prisma.product.findUnique({
            where: { id: params.id },
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
        const body = productUpdateSchema.parse(json);

        const updatedProduct = await prisma.product.update({
            where: { id: params.id },
            data: body,
        });

        return NextResponse.json(updatedProduct);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation Error", details: error.errors },
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
        await prisma.product.delete({
            where: { id: params.id },
        });
        return NextResponse.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Failed to delete product:", error);
        return NextResponse.json(
            { error: "Failed to delete product" },
            { status: 500 }
        );
    }
}
