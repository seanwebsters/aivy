import type { Metadata } from "next";
import { ChatLauncher } from "@/components/dashboard/chat";
import { DashboardNav } from "@/components/dashboard/nav";
import { requireDashboard } from "@/lib/dashboard";
import { ensureDemo, DEMO_ID } from "@/lib/demo";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default async function DashboardLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id === DEMO_ID) await ensureDemo();
  const a = await requireDashboard(id);
  const first = a.opportunities[0];
  const demo = a.mode === "demo";
  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,#f6f2ff_0%,#fbf7f1_420px)]">
      <DashboardNav id={id} name={a.profile.name} demo={demo} />
      <div className="pb-28 lg:pb-12 lg:pl-64">
        {demo && <div className="no-print bg-violet-600 px-4 py-2 text-center text-sm font-medium text-white">You&apos;re viewing a demo for a fictional business. <a href="/#start" className="underline underline-offset-2">Analyse your own business free →</a></div>}
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">{children}</div>
      </div>
      <ChatLauncher
        analysisId={id}
        greeting={`Hi! I'm Aivy 👋 I know your plan for ${a.profile.name} inside out. What would you like to set up first?`}
        suggestions={[`How do I set up the ${first.title.replace(/^AI /, "").toLowerCase()}?`, "Which tools will this cost me?", "Is this safe for customer data?"]}
      />
    </div>
  );
}
