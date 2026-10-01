import fs from "node:fs";
import path from "node:path";
import type { ServerResponse } from "node:http";
import type { Connect, Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const ORT_WASM = "ort-wasm-simd.wasm";

function ortWasmAssets(): Plugin {
  const source = path.resolve("node_modules/onnxruntime-web/dist", ORT_WASM);
  const serve: Connect.NextHandleFunction = (req, res, next) => {
    const name = decodeURIComponent((req.url ?? "").split("?")[0] ?? "").replace(/^\//, "");
    if (name !== ORT_WASM) {
      next();
      return;
    }
    if (!fs.existsSync(source)) {
      next();
      return;
    }
    res.setHeader("Content-Type", "application/wasm");
    fs.createReadStream(source).pipe(res as ServerResponse);
  };
  return {
    name: "ort-wasm-assets",
    configureServer(server) {
      server.middlewares.use("/ort", serve);
    },
    closeBundle() {
      if (!fs.existsSync(source)) return;
      const destDir = path.resolve("dist/ort");
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(source, path.join(destDir, ORT_WASM));
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), ortWasmAssets()],
  optimizeDeps: {
    exclude: ["onnxruntime-web"],
  },
  server: {
    host: true,
    port: 5200,
    strictPort: false,
  },
  preview: {
    host: true,
    port: 5200,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three")) return "three";
        },
      },
    },
  },
});
