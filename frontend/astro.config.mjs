import { defineConfig } from 'astro/config';
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react({
    babel: {
      plugins: [["module:@preact/signals-react-transform"]]
    }
  }), tailwind({
    applyBaseStyles: false
  })],
  adapter: node({
    mode: "standalone"
  }),
  image: {
    domains: ["localhost"]
  }
});