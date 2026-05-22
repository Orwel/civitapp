import type { EmailOtpType } from "@supabase/supabase-js";

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/infrastructure/supabase/server";



/**

 * Intercambia el token del enlace de correo (confirmación, recuperación de contraseña, etc.)

 * y redirige al usuario. Necesario para el flujo PKCE con Supabase.

 */

export async function GET(request: NextRequest) {

  const { searchParams } = new URL(request.url);

  const token_hash = searchParams.get("token_hash");

  const type = searchParams.get("type") as EmailOtpType | null;

  const message = searchParams.get("message");

  const defaultNext =

    type === "signup" || type === "email" ? "/login" : "/reset-password";

  const next = searchParams.get("next") ?? defaultNext;



  const redirectTo = request.nextUrl.clone();

  redirectTo.pathname = next.startsWith("/") ? next : `/${next}`;

  redirectTo.search = "";

  if (message) {

    redirectTo.searchParams.set("message", message);

  }



  if (token_hash && type) {

    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({

      type,

      token_hash,

    });

    if (!error) {

      return NextResponse.redirect(redirectTo);

    }

  }



  redirectTo.pathname = "/reset-password";

  redirectTo.searchParams.set("error", "invalid_or_expired");

  return NextResponse.redirect(redirectTo);

}

