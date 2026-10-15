// Local-development entry for opencode v2.
//
// opencode v2 resolves a configured local plugin *directory* by looking for a
// `server` entry (then `index`). This file lets you point opencode directly at
// the repository without building first:
//
//   { "plugins": ["/absolute/path/to/opencode-bocha"] }
//
// The npm-published package instead resolves through package.json `exports`
// ("." and "./server" both map to dist/index.js).
export { default } from "./src/index";
