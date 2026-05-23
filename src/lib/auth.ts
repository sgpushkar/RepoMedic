import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import dbConnect from "@/lib/db";
import { User } from "@/lib/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      authorization: {
        params: { scope: 'read:user user:email repo' }
      }
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      try {
        if (new URL(url).origin === new URL(baseUrl).origin) {
          return url;
        }
      } catch (e) {}
      return baseUrl;
    },
    async jwt({ token, account, user }: any) {
      // On first sign-in, persist the MongoDB _id explicitly
      if (user?.id) {
        token.userId = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async signIn({ user, account, profile }: any) {
      await dbConnect();
      const githubId = profile.id;
      const data = {
        githubId,
        login: profile.login,
        name: profile.name || profile.login,
        avatar_url: profile.avatar_url || '',
        html_url: profile.html_url || '',
        public_repos: profile.public_repos || 0,
        followers: profile.followers || 0,
        accessToken: account?.access_token,
      };

      let existingUser = await User.findOne({ githubId });
      if (existingUser) {
        Object.assign(existingUser, data);
        await existingUser.save();
        user.id = existingUser._id.toString();
      } else {
        const newUser = await User.create(data);
        user.id = newUser._id.toString();
      }
      return true;
    },
    async session({ session, token }: any) {
      if (session.user) {
        // Prefer the explicitly-stored MongoDB _id over token.sub
        const userId = token.userId || token.sub;
        session.user.id = userId;
        try {
          await dbConnect();
          const u = await User.findById(userId);
          if (u) {
            session.accessToken = u.accessToken;
          }
        } catch (e: any) {
          // Don't crash the session if DB lookup fails
          console.error('[Auth] session callback DB error:', e.message);
        }
      }
      return session;
    }
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET || "repomedic_default_secret_key_123",
};
