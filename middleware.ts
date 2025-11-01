import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ token }) => {
      if (!token) return false;
      const role = token.role as string | undefined;
      return role === "TEACHER" || role === "ADMIN";
    },
  },
});

export const config = {
  matcher: ["/dashboard", "/deck/:path*"],
};
