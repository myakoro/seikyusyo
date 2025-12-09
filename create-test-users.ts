import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('password123', 10);

    // Create Company Admin
    const admin = await prisma.user.upsert({
        where: { username: 'test_admin' },
        update: {},
        create: {
            username: 'test_admin',
            email: 'admin@test.com',
            passwordHash,
            role: 'COMPANY',
            status: 'ACTIVE',
        },
    });
    console.log('Created admin:', admin.username);

    // Create Freelancer User
    const flUser = await prisma.user.upsert({
        where: { username: 'test_freelancer' },
        update: {},
        create: {
            username: 'test_freelancer',
            email: 'freelancer@test.com',
            passwordHash,
            role: 'FREELANCER',
            status: 'ACTIVE',
        },
    });

    // Create Freelancer Profile
    const freelancer = await prisma.freelancer.upsert({
        where: { userId: flUser.id },
        update: {},
        create: {
            name: 'Test Freelancer',
            email: 'freelancer@test.com',
            userId: flUser.id,
            status: 'ACTIVE',
        },
    });
    console.log('Created freelancer:', flUser.username);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
