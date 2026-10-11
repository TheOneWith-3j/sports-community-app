import { NextResponse, type NextRequest } from "next/server";

import { middlewareConfig, refreshSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return refreshSession(request);
}

export const config = middlewareConfig;

export { NextResponse };
