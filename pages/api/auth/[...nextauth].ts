import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword } from "@/lib/auth"; // You'll need to create this helper
import { findUserByEmail } from "@/services/user.service"; // You'll need to create this

export default NextAuth({
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

        const isValid = await verifyPassword(credentials.password, user.passwordHash); // Assumes you store a hashed password

        if (!isValid) {
          throw new Error('Could not log you in!');
        }

        // Return a user object for the session
        return { id: user.id, email: user.email, name: user.username, role: user.role };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
        if (user) {
            token.id = user.id;
            token.role = user.role;
        }
        return token;
    },
    async session({ session, token }) {
        if (session.user) {
            session.user.id = token.id as string;
            session.user.role = token.role as string;
        }
        return session;
    }
  },
  pages: {
    signIn: '/auth/signin', // A custom sign-in page
  },
  secret: process.env.NEXTAUTH_SECRET,
});
