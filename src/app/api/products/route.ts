import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const productSchema = z.object({
    freelancerId: z.string().uuid("有効なフリーランスIDを指定してください"),
    name: z.string().min(1, "商品名は必須です").max(200),
    unitPrice: z.number().min(0, "単価は0以上である必要があります"),
    taxType: z.enum(["INCLUSIVE", "EXCLUSIVE"]).default("EXCLUSIVE"),
    taxRate: z.number().default(10.00),
    withholdingTaxTarget: z.boolean().default(true),
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
    displayOrder: z.number().int().default(0),
});

export async function GET(request: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const freelancerId = searchParams.get("freelancer_id");

    try {
        const whereClause = freelancerId ? { freelancerId } : {};

        const products = await prisma.product.findMany({
            where: whereClause,
            orderBy: [
                { freelancerId: 'asc' },
                { displayOrder: 'asc' },
                { createdAt: 'desc' }
            ],
            include: {
                freelancer: {
                    select: { name: true }
                }
            }
        });
        return NextResponse.json(products);
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "COMPANY") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const json = await request.json();
        const body = productSchema.parse(json);

        // Verify freelancer exists
        const freelancer = await prisma.freelancer.findUnique({
            where: { id: body.freelancerId }
        });
        if (!freelancer) {
            return NextResponse.json({ error: "Freelancer not found" }, { status: 404 });
        }

        const product = await prisma.product.create({
            data: body,
        });

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation Error", details: error.errors },
                { status: 400 }
            );
        }
        console.error("Failed to create product:", error);
        return NextResponse.json(
            { error: "Failed to create product" },
            { status: 500 }
        );
    }
}
