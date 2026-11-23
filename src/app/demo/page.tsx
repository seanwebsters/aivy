import { redirect } from "next/navigation";
import { DEMO_ID, ensureDemo } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default async function Demo() {
  await ensureDemo();
  redirect(`/dashboard/${DEMO_ID}`);
}
