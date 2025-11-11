import { defineConfig } from "vitepress";

export default defineConfig({
  title: "NIST Framework",
  description:
    "Enterprise-grade full-stack SSR framework combining NestJS architecture with Vite performance. Build scalable, type-safe React applications with 19ms response times.",
  base: "/",
  head: [
    ["meta", { name: "theme-color", content: "#646cff" }],
    ["meta", { name: "og:type", content: "website" }],
    ["meta", { name: "og:locale", content: "en" }],
    ["meta", { name: "og:site_name", content: "NIST Framework" }],
  ],

  themeConfig: {
    logo: "/logo.svg",

    nav: [
      { text: "Guide", link: "/guide/introduction" },
      { text: "Features", link: "/features/pages" },
      { text: "Advanced", link: "/advanced/performance" },
      { text: "API Reference", link: "/api/decorators" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "What is NIST?", link: "/guide/introduction" },
            { text: "Getting Started", link: "/guide/getting-started" },
            { text: "Installation", link: "/guide/installation" },
            { text: "Project Structure", link: "/guide/project-structure" },
            { text: "Configuration", link: "/guide/configuration" },
          ],
        },
      ],

      "/features/": [
        {
          text: "Core Features",
          items: [
            { text: "Pages & Routing", link: "/features/pages" },
            { text: "Layouts", link: "/features/layouts" },
            { text: "Dynamic Metadata", link: "/features/metadata" },
            { text: "Data Fetching", link: "/features/data-fetching" },
            { text: "Guards & Authentication", link: "/features/guards" },
            { text: "Request Context", link: "/features/request-context" },
            { text: "Error Handling", link: "/features/error-handling" },
            { text: "404 Not Found", link: "/features/not-found" },
          ],
        },
      ],

      "/api/": [
        {
          text: "API Reference",
          items: [
            { text: "Decorators", link: "/api/decorators" },
            { text: "TypeScript Types", link: "/api/types" },
          ],
        },
      ],

      "/advanced/": [
        {
          text: "Advanced Topics",
          items: [
            { text: "Performance Optimization", link: "/advanced/performance" },
            { text: "Production Deployment", link: "/advanced/deployment" },
            { text: "Testing", link: "/advanced/testing" },
            {
              text: "Integrate with Existing Project",
              link: "/advanced/existing-project",
            },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/yourusername/nist-stack" },
    ],

    search: {
      provider: "local",
    },

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2025-present",
    },
  },

  markdown: {
    theme: {
      light: "github-light",
      dark: "github-dark",
    },
  },
});
