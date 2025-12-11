import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const companySchema = z.object({
    name: z.string().min(1, "会社名は必須です"),
    postalCode: z.string().optional(),
    address: z.string().min(1, "住所は必須です"),
    phoneNumber: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    registrationNumber: z.string().regex(/^T\d{13}$/, "適格請求書登録番号の形式が正しくありません(T+13桁)").optional().or(z.literal("")),
    // Bank details
    bankName: z.string().optional(),
    bankBranch: z.string().optional(),
    accountType: z.enum(["ORDINARY", "CURRENT", "SAVINGS"]).optional(),
    accountNumber: z.string().optional(),
    accountHolder: z.string().optional(),
});

export async function GET(request: Request) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        // Assuming single tenant/company system, fetch the first record
        const company = await prisma.companyInfo.findFirst();
        return NextResponse.json(company || {}); // Return empty object if not set
    } catch (error) {
        console.error("Failed to fetch company:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.user.role !== "COMPANY") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const json = await request.json();
        const body = companySchema.parse(json);

        // Fetch existing company to update or create new if not exists
        const existingCompany = await prisma.companyInfo.findFirst();

        let company;
        if (existingCompany) {
            company = await prisma.companyInfo.update({
                where: { id: existingCompany.id },
                data: {
                    companyName: body.name,
                    postalCode: body.postalCode || null,
                    address: body.address,
                    phone: body.phoneNumber || null,
                    email: body.email || null,
                    registrationNumber: body.registrationNumber || null,
                    bankName: body.bankName || null,
                    bankBranch: body.bankBranch || null,
                    accountType: body.accountType || "ORDINARY",
                    accountNumber: body.accountNumber || null,
                    accountHolder: body.accountHolder || null,
                }
            });
        } else {
            company = await prisma.companyInfo.create({
                data: {
                    companyName: body.name,
                    postalCode: body.postalCode || null,
                    address: body.address,
                    phone: body.phoneNumber || null,
                    email: body.email || null,
                    registrationNumber: body.registrationNumber || null,
                    bankName: body.bankName || null,
                    bankBranch: body.bankBranch || null,
                    accountType: body.accountType || "ORDINARY",
                    accountNumber: body.accountNumber || null,
                    accountHolder: body.accountHolder || null,
                }
            });
        }

        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: "COMPANY_UPDATE",
                details: "Updated company settings"
            }
        });

        return NextResponse.json(company);

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation Error", details: (error as any).errors }, { status: 400 });
        }
        console.error("Failed to update company:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            message: (error as Error).message,
            stack: (error as Error).stack
        }, { status: 500 });
    }
}
