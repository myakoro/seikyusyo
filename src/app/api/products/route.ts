import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createProductSchema = z.object({
    name: z.string().min(1, "商品名は必須です").max(200),
    description: z.string().optional(),
    unitPrice: z.number().min(0, "単価は0以上である必要があります"),
    taxType: z.enum(["INCLUSIVE", "EXCLUSIVE"]),
    taxRate: z.number().min(0).max(100),
    withholdingTaxTarget: z.boolean(),
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
    freelancerId: z.string().optional(), // If product is linked to specific freelancer
});

export async function GET(request: Request) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const freelancerId = searchParams.get("freelancerId");

    try {
        const whereClause: any = {};
        if (status) whereClause.status = status;
        if (freelancerId) whereClause.freelancerId = freelancerId;

        // Access control:
        // Company can see all.
        // Freelancer can ONLY see their own products (if products have freelancerId) OR general products (if freelancerId is null).
        // For MVP, products seem to be global masters manageable by Company.
        // Or are they per Freelancer?
        // Design doc 02_DB says `freelancerId` in Product is nullable relation.
        // "Freelancer (Optional relationship, if product belongs to specific freelancer)"

        if (session.user.role === "FREELANCER") {
            const userFreelancer = await prisma.freelancer.findUnique({
                where: { userId: session.user.id }
            });

            // If freelancer logged in, show Global Products (freelancerId: null) AND Own Products
            if (userFreelancer) {
                whereClause.OR = [
                    { freelancerId: null },
                    { freelancerId: userFreelancer.id }
                ];
            } else {
                return NextResponse.json({ products: [] });
            }
        }

        const products = await prisma.product.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            include: {
                freelancer: {
                    select: { name: true }
                }
            }
        });

        return NextResponse.json({ products });
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only Company can create global products.
    // Freelancers might create their own? Design check required.
    // Assuming Company manages masters for now.
    if (session.user.role !== "COMPANY") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const json = await request.json();
        const body = createProductSchema.parse(json);

        const product = await prisma.product.create({
            data: {
                name: body.name,
                description: body.description,
                unitPrice: body.unitPrice,
                taxType: body.taxType,
                taxRate: body.taxRate,
                withholdingTaxTarget: body.withholdingTaxTarget,
                status: body.status,
                freelancerId: body.freelancerId || undefined,
            } as any
        });

        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: "PRODUCT_CREATE",
                details: `Created product: ${body.name}`
            }
        });

        return NextResponse.json(product, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation Error", details: (error as any).errors }, { status: 400 });
        }
        console.error("Failed to create product:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
