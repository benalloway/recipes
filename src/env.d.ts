/// <reference types="@cloudflare/workers-types" />

type RuntimeBindings = {
  DB: D1Database;
  MEDIA: R2Bucket;
  ASSETS: Fetcher;
  RESEND_API_KEY?: string;
  AI_IMPORT_ENABLED?: string;
};

declare namespace App {
  interface Locals {
    runtime: RuntimeBindings | undefined;
    cfContext: ExecutionContext;
  }
}

declare module 'cloudflare:workers' {
  export const env: RuntimeBindings & Record<string, unknown>;
}

declare namespace App {
  interface Locals {
    runtime: RuntimeBindings | undefined;
  }
}
