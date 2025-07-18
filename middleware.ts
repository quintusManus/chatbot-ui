// middleware.ts
import { createClient } from "@/lib/supabase/middleware";
import { i18nRouter } from "next-i18n-router";
import { NextResponse, type NextRequest } from "next/server";
import i18nConfig from "./i18nConfig";

export async function middleware(request: NextRequest) {
  const i18nResult = i18nRouter(request, i18nConfig);
  if (i18nResult) return i18nResult;

  // bypass auth for /<workspaceId>/chat
  if (request.nextUrl.pathname.match(/^\/[^\/]+\/chat$/)) {
    return NextResponse.next();
  }

  try {
    const { supabase, response } = createClient(request);
    const session = await supabase.auth.getSession();

    // redirect home → workspace chat
    if (session.data.session && request.nextUrl.pathname === "/") {
      const { data: homeWorkspace, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", session.data.session.user.id)
        .eq("is_home", true)
        .single();
      if (!homeWorkspace) throw new Error(error?.message);
      return NextResponse.redirect(
        new URL(`/${homeWorkspace.id}/chat`, request.url)
      );
    }

    return response;
  } catch {
    // on any error, just continue
    return NextResponse.next({
      request: { headers: request.headers },
    });
  }
}

export const config = {
  matcher: "/((?!api|static|.*\\..*|_next|auth|chat).*)",
};