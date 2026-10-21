// Ambient declarations for compile-time constants substituted by the build
// configs. The build identity lives in electron-vite's main `define` block;
// contributor / `pnpm dev` / third-party builds substitute literal `null`,
// which the local diagnostic channel reports as `dev`.
//
// The CI release workflow (and only the CI release workflow) provides the
// stable or release-candidate identity. There is no runtime env-var fallback.
//
declare const ORCA_BUILD_IDENTITY: 'stable' | 'rc' | null

// Full commit the build was made from (`git rev-parse HEAD`); official skill installs pin to it.
declare const ORCA_BUILD_COMMIT: string

// ORCA_LAYOUT_OWNER is declared and read in one place: src/shared/layout-owner-switch.ts.
