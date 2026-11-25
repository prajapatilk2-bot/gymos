"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

import type { Auth } from "@/server/auth/auth";

export const authClient = createAuthClient({
  basePath: "/api/v1/auth",
  plugins: [inferAdditionalFields<Auth>()],
});

export const { useSession, signOut } = authClient;
