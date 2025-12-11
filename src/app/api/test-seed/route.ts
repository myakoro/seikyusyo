import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        const hashedPassword = await bcrypt.hash("password123", 10);

        // Create Company User
        await prisma.user.upsert({
            where: { email: "admin@example.com" },
            update: {},
            create: {
                email: "admin@example.com",
                username: "admin",
                passwordHash: hashedPassword,
                role: "COMPANY",
                status: "ACTIVE",
            },
        });

        // Check if data exists
        const count = await prisma.companyInfo.count();
        if (count === 0) {
            await prisma.companyInfo.create({
                data: {
                    name: "Test Company Inc.",
                    email: "info@testcompany.com",
                    phone: "03-1234-5678",
                    address: "Tokyo, Japan",
                    postalCode: "100-0001"
                }
            })
        }

        // Create Freelancer User
        const freelancerUser = await prisma.user.upsert({
            where: { email: "freelancer@example.com" },
            update: {},
            create: {
                email: "freelancer@example.com",
                username: "freelancer",
                passwordHash: hashedPassword,
                role: "FREELANCER",
                status: "ACTIVE",
            },
        });

        // Create Freelancer Profile
        await prisma.freelancer.upsert({
            where: { email: "freelancer@example.com" },
            update: {},
            create: {
                email: "freelancer@example.com",
                name: "Test Freelancer",
                userId: freelancerUser.id,
                status: "ACTIVE"
            }
        });

        return NextResponse.json({ success: true, message: "Seeded" });
    } catch (error) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
