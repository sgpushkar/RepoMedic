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
      const actualBase = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : baseUrl;
      if (url.startsWith("/")) {
        return `${actualBase}${url}`;
      }
      try {
        if (new URL(url).origin === new URL(actualBase).origin) {
          return url;
        }
      } catch (e) {}
      return actualBase;
    },
    async jwt({ token, account }: any) {
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
        session.user.id = token.sub;
        await dbConnect();
        const u = await User.findById(token.sub);
        if (u) {
          session.accessToken = u.accessToken;
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
