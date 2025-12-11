import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debug Info ---');
    // Check available models on prisma instance keys (filtering internal ones starting with _)
    const models = Object.keys(prisma).filter(k => !k.startsWith('_'));
    console.log('Available models:', models);

    console.log('--- Starting Backend Verification ---');

    // Verify Company Settings
    if ('companyInfo' in prisma) {
        console.log('\n[Test 1] Company Settings');
        // @ts-ignore
        const existingCompany = await prisma.companyInfo.findFirst();

        if (existingCompany) {
            console.log('Found existing company, updating...');
            // @ts-ignore
            await prisma.companyInfo.update({
                where: { id: existingCompany.id },
                data: { companyName: "Updated Company Name Check" }
            });
            console.log('✅ Company updated successfully');
        } else {
            console.log('No company found, creating...');
            // @ts-ignore
            await prisma.companyInfo.create({
                data: { companyName: "Created Company Name Check" }
            });
            console.log('✅ Company created successfully');
        }
    } else {
        console.error('❌ CompanyInfo model not found in Prisma Client. Available keys:', Object.keys(prisma));
    }

    // 2. Verify Freelancer Creation (SC-09)
    console.log('\n[Test 2] Freelancer Management');
    const flUser = await prisma.user.findFirst({ where: { username: "test_freelancer" } });
    if (!flUser) {
        console.log("Skipping freelancer test: User not found");
    } else {
        const freelancer = await prisma.freelancer.findUnique({
            where: { userId: flUser.id }
        });
        console.log('✅ Freelancer retrieved:', freelancer?.id);
    }
}

main()
    .catch((e) => {
        console.error('❌ Verification Failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
