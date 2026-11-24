import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  // Declare your Neon services here
  auth: false,
  buckets: {
    // "private" is the default; use "public_read" for anonymous reads
    attachments: { access: "private" },
  },
  functions: {
    attach: {
      name: "Attachments signer",
      source: "neon/attachments/index.ts",
      env: {
        VITE_SUPABASE_URL: { value: process.env.VITE_SUPABASE_URL, required: true },
        VITE_SUPABASE_ANON_KEY: { value: process.env.VITE_SUPABASE_ANON_KEY, required: true },
      },
    },
  },
  // Branch policy: per-branch tuning
  branch: (branch) => {
    if (branch.isDefault) {
      // Default branch: no overrides, uses project defaults
      return {};
    }
    if (!branch.exists) {
      // New non-default branches: auto-expire
      // Run `neon checkout <name>` to create a new branch with these settings
      return { ttl: "7d" };
    }
    // Existing branch: no changes
    return {};
  },
});
