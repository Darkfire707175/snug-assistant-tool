```ts
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  base: "/snug-assistant-tool/",

  tanstackStart: {
    server: {
      entry: "server",
    },

    prerender: {
      enabled: true,
      crawlLinks: true,
      failOnError: false,
    },
  },
});
```
