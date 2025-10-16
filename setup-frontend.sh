#!/bin/bash

# A script to scaffold the JetPrint Vite + React + TypeScript frontend.
# This ensures a consistent and reproducible setup.

# Exit immediately if a command fails
set -e

PROJECT_NAME="jetprint-frontend"

# --- Main Setup Logic ---

# 1. Create a new Vite project if the directory doesn't exist
if [ -d "$PROJECT_NAME" ]; then
    echo "Directory '$PROJECT_NAME' already exists. Skipping project creation."
else
    echo "Creating new Vite + React + TS project: $PROJECT_NAME..."
    # The '.' creates the project in the current directory, so we create and cd first.
    npm create vite@latest "$PROJECT_NAME" -- --template react-ts
fi

cd "$PROJECT_NAME"

# 2. Install required production dependencies
echo "Installing production dependencies..."
npm install axios react-router-dom socket.io-client

# 3. Install required development dependencies for Tailwind CSS
echo "Installing development dependencies for Tailwind CSS..."
npm install --save-dev tailwindcss postcss autoprefixer

# 4. Initialize Tailwind CSS
echo "Initializing Tailwind CSS..."
npx tailwindcss init -p

# 5. Configure Tailwind CSS to scan our files for classes
echo "Configuring Tailwind CSS content paths..."
# Use a temporary file to avoid clobbering the file if it already exists with content
CONFIG_FILE="tailwind.config.js"
TEMP_CONFIG="tailwind.config.js.tmp"

# The content array tells Tailwind which files to scan for utility classes.
cat > "$TEMP_CONFIG" << EOL
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOL
mv "$TEMP_CONFIG" "$CONFIG_FILE"


# 6. Add Tailwind directives to the main CSS file
echo "Adding Tailwind directives to index.css..."
CSS_FILE="src/index.css"
TEMP_CSS="src/index.css.tmp"

cat > "$TEMP_CSS" << EOL
@tailwind base;
@tailwind components;
@tailwind utilities;
EOL
# Append any existing content from the original index.css file, if any
# Though for a new vite project, it's usually safe to overwrite.
# cat "$CSS_FILE" >> "$TEMP_CSS"
mv "$TEMP_CSS" "$CSS_FILE"

# 7. Create the application folder structure
echo "Creating application directory structure..."
mkdir -p src/pages
mkdir -p src/components
mkdir -p src/services
mkdir -p src/hooks
mkdir -p src/context

# Create placeholder files to establish the structure
touch src/pages/LoginPage.tsx
touch src/pages/OrdersPage.tsx
touch src/pages/NewOrderPage.tsx
touch src/pages/AssignmentsPage.tsx
touch src/pages/DashboardPage.tsx

touch src/components/NotificationToast.tsx
touch src/components/OrderCard.tsx
touch src/components/StageTimeline.tsx
touch src/components/ClaimButton.tsx

touch src/services/api.ts
touch src/hooks/useWebSocket.ts
touch src/context/AuthContext.tsx

echo "✅ Frontend scaffolding complete!"
echo "✅ Project created in './$PROJECT_NAME/'"
echo ""
echo "Next steps:"
echo "1. Run 'npm install' inside the '$PROJECT_NAME' directory."
echo "2. Run 'npm run dev' to start the development server."
echo "3. Start building out the components and pages."