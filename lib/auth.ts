import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { z } from 'zod';

/**
 * Validation schema for user login credentials.
 * Ensures the email is properly formatted and a password is provided.
 */
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * NextAuth configuration options.
 * Defines the authentication providers, JWT strategy, and session callbacks.
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter both email and password');
        }

        // Validate formats
        const result = loginSchema.safeParse(credentials);
        if (!result.success) {
          throw new Error('Invalid email or password format');
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();

        // Find user
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        // To avoid user enumeration, do not specify if email or password was wrong
        if (!user || !user.password) {
          throw new Error('Invalid email or password');
        }

        // Compare password
        const passwordMatch = await bcrypt.compare(credentials.password, user.password);
        if (!passwordMatch) {
          throw new Error('Invalid email or password');
        }

        // Return user data (id, name, email)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
