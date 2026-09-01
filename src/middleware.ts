import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const protectedPrefixes = [
  "/student/dashboard",
  "/courses",
  "/notifications",
  "/complaints",
  "/settings",
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

        return !isProtected || Boolean(token);
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
    "/complaints/:path*",
    "/settings/:path*",
  ],
};
