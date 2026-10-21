export const BUILD_IDENTITY_RE = /\b(?:const|let|var)\s+BUILD_IDENTITY\s*=\s*["`](rc|stable)["`]/

export const MINIFIED_BUILD_IDENTITY_RE =
  /(?:\b(?:const|let|var)\s+|,\s*)[$\w]+\s*=\s*["'`](rc|stable)["'`]/
