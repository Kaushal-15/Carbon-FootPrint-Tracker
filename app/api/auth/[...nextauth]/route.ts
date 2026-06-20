import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Next.js Route Handler for NextAuth authentication.
 * Handles GET and POST requests for login, logout, and session management.
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
