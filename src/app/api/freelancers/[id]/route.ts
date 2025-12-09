import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const freelancerUpdateSchema = z.object({
    name: z.string().min(1, "氏名は必須です").max(200).optional(),
    postalCode: z.string().regex(/^\d{3}-?\d{4}$/, "郵便番号の形式が正しくありません").optional().or(z.literal("")),
    address: z.string().optional(),
    phoneNumber: z.string().optional(),
    taxRegistrationNumber: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
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
        const freelancer = await prisma.freelancer.findUnique({
            where: { id },
            include: { user: { select: { email: true, username: true } } }
        });

        if (!freelancer) {
            return NextResponse.json({ error: "Freelancer not found" }, { status: 404 });
        }

        // Access check: Company can view all, Freelancer can view self
        if (session.user.role === "FREELANCER") {
            const userFreelancer = await prisma.freelancer.findUnique({
                where: { userId: session.user.id }
            });
            // Usually logged in freelancer checks their own profile via /api/freelancers/me or similar, 
            // but if accessing by ID, ensure match.
            if (!userFreelancer || userFreelancer.id !== id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
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
        const body = freelancerUpdateSchema.parse(json);

        const updatedFreelancer = await prisma.freelancer.update({
            where: { id },
            data: {
                name: body.name,
                postalCode: body.postalCode || null,
                address: body.address || null,
                phone: body.phoneNumber || null,
                invoiceNumber: body.taxRegistrationNumber || null,
                status: body.status,
            },
        });

        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: "FREELANCER_UPDATE",
                details: `Updated freelancer: ${updatedFreelancer.name}`
            }
        });

        return NextResponse.json(updatedFreelancer);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation Error", details: (error as any).errors },
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
        await prisma.freelancer.update({
            where: { id },
            data: { status: "INACTIVE" }
        });

        // Optionally deactivate User account if linked?
        const freelancer = await prisma.freelancer.findUnique({ where: { id } });
        if (freelancer && freelancer.userId) {
            await prisma.user.update({
                where: { id: freelancer.userId },
                data: { status: "INACTIVE" }
            });
        }

        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: "FREELANCER_DELETE",
                details: `Deactivated freelancer ID: ${id}`
            }
        });

        return NextResponse.json({ message: "Freelancer deactivated successfully" });
    } catch (error) {
        console.error("Failed to deactivate freelancer:", error);
        return NextResponse.json(
            { error: "Failed to deactivate freelancer" },
            { status: 500 }
        );
    }
}
