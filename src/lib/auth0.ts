import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { z } from "zod";

const auth0ConfigSchema = z.object({
  AUTH0_DOMAIN: z.string().min(1),
  AUTH0_CLIENT_ID: z.string().min(1),
  AUTH0_CLIENT_SECRET: z.string().min(1),
  AUTH0_SECRET: z.string().regex(/^[\da-f]{64}$/i),
  APP_BASE_URL: z.string().url(),
});

let client: Auth0Client | undefined;

export function isAuth0Configured(): boolean {
  return auth0ConfigSchema.safeParse(process.env).success;
}

export function getAuth0Client(): Auth0Client {
  const config = auth0ConfigSchema.parse(process.env);

  client ??= new Auth0Client({
    domain: config.AUTH0_DOMAIN,
    clientId: config.AUTH0_CLIENT_ID,
    clientSecret: config.AUTH0_CLIENT_SECRET,
    secret: config.AUTH0_SECRET,
    appBaseUrl: config.APP_BASE_URL,
  });

  return client;
}
