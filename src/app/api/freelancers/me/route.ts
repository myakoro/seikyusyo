import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Special endpoint for logged-in freelancer to get their own profile
export async function GET(request: Request) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        // If user is COMPANY, this endpoint doesn't make sense, return 404 or empty?
        // Or could return company profile? 
        // Requirement SC-16 is for Freelancer MyPage.

        const freelancer = await prisma.freelancer.findUnique({
            where: { userId: session.user.id }
        });

        if (!freelancer) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        return NextResponse.json(freelancer);
    } catch (error) {
        console.error("Failed to fetch my profile:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
