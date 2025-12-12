#!/bin/bash
set -e

echo "Updating database schema..."
npx prisma db push --accept-data-loss --skip-generate

echo "Starting Next.js server..."
npx next start
