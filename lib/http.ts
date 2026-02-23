import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function withNoStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store");
  return response;
}
