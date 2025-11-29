import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@react-router/vercel";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
  presets: [vercelPreset()],
} satisfies Config;
