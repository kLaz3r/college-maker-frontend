import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function unauthorizedResponse() {
  const response = new NextResponse("Unauthorized", { status: 401 });
  response.headers.set("WWW-Authenticate", 'Basic realm="Secure Area"');
  return response;
}

export function middleware(request: NextRequest) {
  console.log("[middleware] executing for", request.nextUrl.pathname);
  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }
  const username = process.env.BASIC_AUTH_USER;
  const password = process.env.BASIC_AUTH_PASSWORD;

  // If credentials are not set, block access by default
  if (!username || !password) {
    return unauthorizedResponse();
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return unauthorizedResponse();
  }

  const [scheme, encoded] = authHeader.split(" ");

  if (scheme !== "Basic" || !encoded) {
    return unauthorizedResponse();
  }

  let decoded: string;
  try {
    decoded = atob(encoded);
  } catch {
    return unauthorizedResponse();
  }

  const [user, pass] = decoded.split(":");

  if (user !== username || pass !== password) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

// Protect everything except Next.js internals and basic public files
export const config = {
  matcher: ["/:path*"],
};
