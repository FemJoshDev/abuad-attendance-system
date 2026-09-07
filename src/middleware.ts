import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const protectedPrefixes = [
  "/student/dashboard",
  "/courses",
  "/notifications",
  "/student/notifications",
  "/complaints",
  "/settings",
  "/lecturer",
  "/admin",
];

export default withAuth(
  function middleware(request) {
    const { pathname } = request.nextUrl;
    const isProtected = protectedPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

    if (!isProtected) {
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        const isProtected = protectedPrefixes.some(
          (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
        );

        if (!isProtected) return true;
        if (!token) return false;
        if (pathname.startsWith("/admin")) return token.role === "ADMIN";
        if (pathname.startsWith("/lecturer")) return token.role === "LECTURER";
        if (pathname.startsWith("/student") || pathname.startsWith("/courses") || pathname.startsWith("/notifications") || pathname.startsWith("/complaints") || pathname.startsWith("/settings")) return token.role === "STUDENT";
        return true;
      },
    },
    pages: {
      signIn: "/",
    },
  },
);

export const config = {
  matcher: [
    "/student/dashboard/:path*",
    "/courses/:path*",
    "/notifications/:path*",
    "/student/notifications/:path*",
    "/complaints/:path*",
    "/settings/:path*",
    "/lecturer/:path*",
    "/admin/:path*",
  ],
};
