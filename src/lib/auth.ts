import { compare, hash } from 'bcryptjs';
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { findUserByEmail } from "@/services/user.service";

export async function hashPassword(password: string) {
  const hashedPassword = await hash(password, 12);
  return hashedPassword;
}

export async function verifyPassword(password: string, hashedPassword: string) {
  const isValid = await compare(password, hashedPassword);
  return isValid;
}

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials) {
            return null;
        }

        const user = await findUserByEmail(credentials.email);

        if (!user) {
          throw new Error('No user found!');
        }

        // const isValid = await verifyPassword(credentials.password, user.passwordHash);

        // if (!isValid) {
        //   throw new Error('Could not log you in!');
        // }

        return { id: user.id, email: user.email, name: user.name, role: 'user' };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
        if (user) {
            token.id = user.id;
            token.role = (user as any).role;
        }
        return token;
    },
    async session({ session, token }) {
        if (session.user) {
            // The type definition for session.user in next-auth might not have id and role by default
            (session.user as any).id = token.id as string;
            (session.user as any).role = token.role as string;
        }
        return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
