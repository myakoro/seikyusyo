import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const dmmf = Prisma.dmmf;
    const companyInfo = dmmf.datamodel.models.find((m) => m.name === "CompanyInfo");
    
    return NextResponse.json({
      status: "ok",
      prismaVersion: Prisma.prismaVersion,
      companyInfoFields: companyInfo?.fields.map(f => ({
        name: f.name,
        type: f.type,
        required: f.isRequired
      }))
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
