#!/bin/bash
set -e

echo "Running Prisma DB Push..."
npx prisma db push --accept-data-loss

echo "Starting Next.js server..."
npx next start
