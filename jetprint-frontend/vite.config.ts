import path from "path" // This import is required
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // This alias tells Vite that "@" means "the src folder"
      "@": path.resolve(__dirname, "./src"),
    },
  },
})