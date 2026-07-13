import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Experimental React Compiler rule — flags the standard fetch-on-mount
      // pattern (useEffect(() => { load(); }, [])) used throughout this codebase.
      // This is a legitimate, working pattern per React's own docs, not a bug.
      "react-hooks/set-state-in-effect": "off",
      // Same experimental rule family — flags standard patterns like
      // window.location.href = url for redirects (e.g. Stripe Checkout).
      "react-hooks/immutability": "off",
    },
  },
  {
    files: ["lib/actions/**/*.ts"],
    rules: {
      // Deliberate pattern for catching Axios errors of varying shape,
      // consistent with the backend's catch (err: any) convention.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;