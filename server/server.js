
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware, getAuth } from '@clerk/express';
import aiRouter from './routes/airoutes.js';
import connectCloudinary from './configs/cloudinary.js';
 
import userRouter from './routes/userRoutes.js';

const app = express();

await connectCloudinary()
// Middleware
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// AI routes
app.use('/api/ai', aiRouter);
app.use('/api/user',userRouter)

// Public route
app.get('/', (req, res) => {
  res.status(200).send('QuickAI server is working fine!');
});

// Protected route
app.get('/protected', (req, res) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Please sign in.',
    });
  }

  res.status(200).json({
    success: true,
    message: 'You are authenticated!',
    userId,
  });
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Start server
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`QuickAI server running at http://localhost:${PORT}`);
});
