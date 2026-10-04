import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/snug-assistant-tool/",
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    TanStackRouterVite(),
    tanstackStart({
      server: {
        entry: "server",
      },
      prerender: {
        enabled: true,
        crawlLinks: true,
        failOnError: false,
      },
    }),
    viteReact(),
  ],
});
