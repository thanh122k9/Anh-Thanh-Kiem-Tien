import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Khởi tạo Firebase Admin SDK sử dụng biến môi trường lấy từ Hosting (Render)
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Render/Heroku thường chuyển đổi \n thành thực thể văn bản, cần replace lại
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
} else {
  console.warn("WARNING: Firebase Admin Env Vars missing, trying default initialization (it might fail if not in GCP)");
  try {
    admin.initializeApp();
  } catch(e) {
    console.error(e);
  }
}

const db = admin.firestore();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', firebaseAdmin: admin.apps.length > 0 });
  });

  // API Webhook - dành cho nhà cung cấp rút gọn (GET request)
  // Usage: https://your-domain.render.com/api/callback/megalink?custom={session_token}
  app.get('/api/callback/:provider', async (req, res) => {
    try {
      // Đa số nhà cung cấp cho cấu hình biến querystring, ta lấy alias, custom hoặc ref
      const sessionToken = req.query.custom || req.query.alias || req.query.ref || req.query.session_token;
      
      if (!sessionToken || typeof sessionToken !== 'string') {
        return res.status(400).json({ error: 'Missing session token' });
      }

      console.log(`[Webhook] Nhận tín hiệu từ ${req.params.provider}. Token: ${sessionToken}`);

      // 1. Tìm TaskLog bằng sessionToken
      const taskLogsQuery = await db.collection('task_logs')
        .where('sessionToken', '==', sessionToken)
        .where('status', '==', 'pending')
        .limit(1)
        .get();

      if (taskLogsQuery.empty) {
        return res.status(404).json({ error: 'Session không tồn tại hoặc đã được hoàn thành.' });
      }

      const logDoc = taskLogsQuery.docs[0];
      const logData = logDoc.data();
      const userId = logData.userId;
      const taskId = logData.taskId;
      const createdAt = logData.createdAt?.toDate?.() || new Date(); 
      const now = new Date();
      
      // Tính độ chênh lệch thời gian
      const diffSeconds = (now.getTime() - createdAt.getTime()) / 1000;

      // Anti-Cheat: Nếu làm nhiệm vụ quá nhanh (dưới 5 giây từ lúc request URL)
      if (diffSeconds < 5) {
        await logDoc.ref.update({
          status: 'suspicious',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          reason: `Hoàn thành quá nhanh (${diffSeconds}s)`
        });
        return res.status(400).json({ error: 'Cảnh báo gian lận, thời gian hoàn thành bất thường' });
      }
      
      // Đếm số lần trong ngày của IP/User này trên 1 nhiệm vụ
      const startOfDay = new Date();
      startOfDay.setHours(0,0,0,0);
      
      const todaysLogsQuery = await db.collection('task_logs')
        .where('userId', '==', userId)
        .where('taskId', '==', taskId)
        .where('status', '==', 'completed')
        .where('completedAt', '>=', startOfDay)
        .get();

      if (todaysLogsQuery.size > 0) {
        await logDoc.ref.update({
          status: 'rejected',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          reason: 'Đã hoàn thành tối đa số lượt giới hạn mỗi ngày.'
        });
        return res.status(400).json({ error: 'Bạn đã hoàn thành nhiệm vụ này trong hôm nay' });
      }

      // 2. Fetch Task details
      const taskDoc = await db.collection('tasks').doc(taskId).get();
      if (!taskDoc.exists) {
        return res.status(404).json({ error: 'Nhiệm vụ không tồn tại' });
      }

      const taskData = taskDoc.data()!;
      if (taskData.status === false) {
         return res.status(400).json({ error: 'Nhiệm vụ đang bị tắt' });
      }

      const rewardAmount = typeof taskData.rewardAmount === 'number' ? taskData.rewardAmount : parseFloat(taskData.rewardAmount);

      // 3. Mark task as completed
      await logDoc.ref.update({
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 4. Update Level & Balance bằng Transaction
      const userRef = db.collection('users').doc(userId);
      
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) return;

        const userData = userDoc.data()!;
        const newBalance = (userData.balance || 0) + rewardAmount;
        let newExp = (userData.exp || 0) + 10;
        let newLevel = userData.level || 1;
        const newTotalCompleted = (userData.totalCompleted || 0) + 1;

        // Level Up logic: Level kế tiếp cần level_hien_tai * 100 exp
        const expNeeded = newLevel * 100;
        if (newExp >= expNeeded) {
          newLevel += 1;
          newExp = 0; // reset
        }

        transaction.update(userRef, {
          balance: newBalance,
          exp: newExp,
          level: newLevel,
          totalCompleted: newTotalCompleted
        });
      });

      console.log(`[Webhook] Success: Đã cập nhật ${rewardAmount}VNĐ cho User [${userId}]`);
      // Thường thì webhook mong trả về string OK
      return res.status(200).send('OK');
      
    } catch (error) {
      console.error('Webhook Error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
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
    console.log(`[Server] Running on port ${PORT}`);
  });
}

startServer();
