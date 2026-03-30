import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // In a real app, you'd use Firebase Admin SDK here to securely update balances.
  // For this demo, we'll simulate some backend logic.
  
  app.post("/api/verify-task", async (req, res) => {
    const { userId, taskId, sessionToken } = req.body;
    
    // Anti-cheat logic would go here:
    // 1. Check if sessionToken exists and is not expired
    // 2. Check if IP is not blacklisted
    // 3. Verify with Shortlink Provider API (webhook or GET request)
    
    // Simulating verification success for demo purposes
    console.log(`Verifying task ${taskId} for user ${userId}`);
    
    res.json({ 
      success: true, 
      message: "Nhiệm vụ hoàn thành! Số dư đã được cập nhật.",
      reward: 500 // Example reward
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
