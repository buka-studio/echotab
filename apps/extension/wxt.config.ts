import path from "path";
import tailwindcss from "@tailwindcss/vite";
// import { postcss } from "tailwindcss";
import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1vbwzQ2F4A5VLg8uPfIYFhn6ICcLLoQzgVMAQ0vN3T66cgk8N0zaktQfUtRRICVAiFG5jUZPAW10COYUmhc1NAt/0OXQmj4Z6Cq1/l/zc0UTbizQNLVI3hZXGkvBjS4Wne+iEMJcJ/AUHr8zmlBcRpotNpyfrxERPb1R/vud9zTXXn8xTxgSgmntzNyvTvLci5Wzcr0aDz3Ll6M7SUOcTDHpFIvTqHvCuOP5oCLMlI0WSA5zpt/RA5HmzPqM+aZoA6Uvo7dqo+p+suXmG1Cz3ZAdiubBdvDRh8/lpEmZzKkGsNq4QukK2hrmXgEDL14gRHKjd8rh+YlN643ed64y2QIDAQAB",
    permissions: [
      "storage",
      "unlimitedStorage",
      "bookmarks",
      "favicon",
      "activeTab",
      "contextMenus",
    ],
    host_permissions: ["<all_urls>"],
    web_accessible_resources: [
      {
        resources: ["newtab.html"],
        matches: ["<all_urls>"],
      },
    ],
    externally_connectable: {
      matches: ["<all_urls>"],
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
    // css: { postcss },
    resolve: {
      alias: {
        "~": path.resolve(__dirname, "./src"),
      },
    },
  }),
  srcDir: "src",
});
