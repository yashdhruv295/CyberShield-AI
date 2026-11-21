import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from the domain root on Vercel (e.g. https://cybershield-ai.vercel.app/).
export default defineConfig({
  plugins: [react()],
  base: "/",
});
