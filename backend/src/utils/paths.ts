import path from "path";

// Anchored to the process's working directory (always `backend/`, since that's
// where `npm run dev` / `npm start` are invoked from) rather than `__dirname` —
// `__dirname` sits one level deeper once TypeScript compiles src/ into dist/src/,
// which would otherwise point dev and prod at two different folders.
export const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
