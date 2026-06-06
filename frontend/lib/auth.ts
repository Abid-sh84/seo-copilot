import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { JWT } from 'next-auth/jwt';

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Auth.js v5 uses AUTH_SECRET; fall back to NEXTAUTH_SECRET for compat
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // On first sign-in, persist the user's Google data in the JWT
      if (account && profile) {
        token.googleId = profile.sub;
        token.image = profile.picture as string;
      }
      return token;
    },
    async session({ session, token }) {
      // Make the JWT token available to the client session
      if (session.user) {
        session.user.id = token.sub ?? '';
        (session as any).accessToken = token; // We'll use this to call backend
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});

// Helper to get the backend JWT token from the Auth.js session
// We sign our own JWT for the backend using the same JWT_SECRET
export async function getBackendToken(session: any): Promise<string | null> {
  if (!session?.user?.id) return null;
  
  // The JWT token that Auth.js creates is already signed with NEXTAUTH_SECRET
  // Our backend validates using the same secret (JWT_SECRET = NEXTAUTH_SECRET)
  return (session as any).accessToken?.sub ?? null;
}
