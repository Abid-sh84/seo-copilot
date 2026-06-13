import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import * as jose from 'jose';

const BACKEND_URL      = process.env.BACKEND_URL ?? 'http://localhost:5000';
const INTERNAL_SECRET  = process.env.INTERNAL_SECRET ?? '';

export async function GET() {
  // 1. Get the NextAuth session (reads the HTTP-only cookie server-side)
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // 2. Upsert the user in MongoDB via the backend and get their _id
  //    session.user.id = Google's `sub` (e.g. "1234567890")
  let mongoUserId: string;
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/upsert-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': INTERNAL_SECRET,
      },
      body: JSON.stringify({
        googleId: session.user.id ?? session.user.email,
        email:    session.user.email,
        name:     session.user.name,
        image:    session.user.image,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[Token Route] Backend upsert failed:', err);
      return NextResponse.json({ error: 'Failed to resolve user' }, { status: 502 });
    }

    const { data } = await res.json();
    mongoUserId = data.userId;
  } catch (err) {
    console.error('[Token Route] Backend unreachable:', err);
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
  }

  // 3. Sign a JWT using the MongoDB _id as `sub` — the backend verifies with the same secret
  const secretKey = new TextEncoder().encode(secret);
  const token = await new jose.SignJWT({
    sub:   mongoUserId,
    email: session.user.email ?? '',
    name:  session.user.name  ?? '',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secretKey);

  return NextResponse.json({ token });
}
