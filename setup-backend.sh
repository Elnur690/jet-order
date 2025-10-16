#!/bin/bash

# A script to scaffold the JetPrint NestJS backend.
# This script ensures a consistent and reproducible setup.

# Exit immediately if a command fails
set -e

PROJECT_NAME="jetprint-backend"

# --- Main Setup Logic ---

# 1. Check for NestJS CLI and install if it's missing
if ! command -v nest &> /dev/null; then
    echo "NestJS CLI not found. Installing globally..."
    npm install -g @nestjs/cli
fi

# 2. Create new NestJS project if it doesn't exist
if [ -d "$PROJECT_NAME" ]; then
    echo "Directory '$PROJECT_NAME' already exists. Skipping project creation."
else
    echo "Creating new NestJS project: $PROJECT_NAME..."
    nest new "$PROJECT_NAME" --package-manager npm --strict
fi

cd "$PROJECT_NAME"

# 3. Install required production dependencies
echo "Installing production dependencies..."
npm install @nestjs/config \
            @nestjs/jwt \
            @nestjs/passport \
            @nestjs/websockets \
            @nestjs/platform-socket.io \
            @nestjs/bullmq \
            bullmq \
            prisma \
            @prisma/client \
            bcrypt \
            class-validator \
            class-transformer \
            passport \
            passport-jwt \
            redis

# 4. Install required development dependencies
echo "Installing development dependencies..."
npm install --save-dev @types/bcrypt @types/passport-jwt ts-node

# 5. Initialize Prisma ORM with PostgreSQL provider
echo "Initializing Prisma..."
npx prisma init --datasource-provider postgresql

# 6. Generate all required modules and their components
echo "Generating backend modules..."

# Core Modules
nest generate module users
nest generate service users --no-spec
nest generate controller users --no-spec

nest generate module auth
nest generate service auth --no-spec
nest generate controller auth --no-spec

nest generate module orders
nest generate service orders --no-spec
nest generate controller orders --no-spec

nest generate module claims
nest generate service claims --no-spec
nest generate controller claims --no-spec

nest generate module notifications
nest generate service notifications --no-spec

nest generate module admin
nest generate service admin --no-spec
nest generate controller admin --no-spec

# Real-time Gateway
nest generate gateway websocket --no-spec

echo "✅ Backend scaffolding complete!"
echo "✅ Project created in './$PROJECT_NAME/'"
echo ""
echo "Next steps:"
echo "1. Define the schema in the 'prisma/schema.prisma' file."
echo "2. Configure your database connection in the '.env' file."
echo "3. Run 'npx prisma migrate dev' to sync your database."