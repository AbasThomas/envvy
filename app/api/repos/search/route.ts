import { NextRequest } from "next/server";

import { ok } from "@/lib/http";

export async function GET(request: NextRequest) {
  void request;
  return ok({ repos: [] });
}
