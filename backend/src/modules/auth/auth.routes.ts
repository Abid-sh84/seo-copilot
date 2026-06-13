import { Router, Request, Response } from 'express';
import { User } from '../../models/User.model';

const authRouter = Router();

// ── POST /api/auth/upsert-user ────────────────────────────────────────────────
// Called by the Next.js token route when a user signs in with Google.
// Upserts the user in MongoDB and returns their MongoDB _id so we can
// embed it as `sub` in the backend JWT.
//
// This endpoint is called server-to-server (from Next.js API route) and
// does NOT require a bearer token — it's protected by the shared secret header.
authRouter.post('/upsert-user', async (req: Request, res: Response): Promise<void> => {
  const sharedSecret = req.headers['x-internal-secret'];
  if (sharedSecret !== process.env.INTERNAL_SECRET) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const { googleId, email, name, image } = req.body as {
    googleId: string;
    email: string;
    name: string;
    image?: string;
  };

  if (!googleId || !email || !name) {
    res.status(400).json({ success: false, error: 'googleId, email, and name are required' });
    return;
  }

  try {
    const normalizedEmail = email.toLowerCase();

    // Find by googleId OR email — prevents E11000 when the user already exists
    // with a different googleId but the same email (e.g. from an earlier test run)
    const user = await User.findOneAndUpdate(
      { $or: [{ googleId }, { email: normalizedEmail }] },
      {
        $set: { googleId, email: normalizedEmail, name, ...(image ? { image } : {}) },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, data: { userId: user._id.toString() } });
  } catch (err) {
    console.error('[Auth] Failed to upsert user:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

export { authRouter };
