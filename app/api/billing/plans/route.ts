import { ok } from "@/lib/http";
import { PLAN_MATRIX, PLAN_ORDER } from "@/lib/plans";

export async function GET() {
  return ok({
    plans: PLAN_ORDER.map((tier) => PLAN_MATRIX[tier]),
  });
}
