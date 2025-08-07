import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define the public routes that can be accessed by anyone
const publicRoutes = ["/login", "/register"];

/**
 * This middleware function checks if the user is authenticated and redirects to
 * the correct page depending on the situation.
 *
 * Case 1: An unauthenticated user tries to access a protected route
 * If there is NO refresh token AND the user is NOT on a public route,
 * redirect to login.
 *
 * Case 2: An authenticated user tries to access a public route
 * If there IS a refresh token AND the user IS on a public route,
 * redirect to dashboard.
 *
 * If none of the above, continue to the requested page.
 */
export function middleware(request: NextRequest) {
  // Get the refresh token cookie from the request
  const refreshToken = request.cookies.get("refreshToken");
  const path = request.nextUrl.pathname;

  // Case 1: An unauthenticated user tries to access a protected route
  // If there is NO refresh token AND the user is NOT on a public route, redirect to login.
  if (!refreshToken && !publicRoutes.includes(path)) {
    console.log("middleware-------------------------");
    console.log("redirect to login");
    console.log(refreshToken, path);
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Case 2: An authenticated user tries to access a public route
  // If there IS a refresh token AND the user IS on a public route, redirect to dashboard.
  if (refreshToken && publicRoutes.includes(path)) {
    console.log("middleware-------------------------");
    console.log("redirect to dashboard");
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If none of the above, continue to the requested page
  return NextResponse.next();
}

// Specify which paths the middleware should apply to
// The matcher will run middleware for all pages except API routes and static files
export const config = {
  matcher: [
    // "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)",

    "/login",
    "/register",
    "/dashboard", //TODO: replace with something like !/login | !/register
    "/(!login | !register)", //OK
  ],
};
