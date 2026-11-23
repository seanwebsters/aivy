import { ChatPanel } from "@/components/dashboard/chat";
import { AivyAvatar } from "@/components/brand";
import { requireDashboard } from "@/lib/dashboard";

export default async function Ask({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await requireDashboard(id);
  const first = a.opportunities[0];
  return (
    <div className="-my-2 flex flex-col overflow-hidden rounded-[30px] bg-white shadow-lift ring-1 ring-violet-100">
      <div className="flex items-center gap-3 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-white px-5 py-4">
        <AivyAvatar size={44} />
        <div>
          <h1 className="text-lg font-bold">Ask Aivy</h1>
          <p className="text-sm text-ink-soft">Knows your business, your plan and your progress. Guides you one step at a time.</p>
        </div>
      </div>
      <ChatPanel
        full
        analysisId={id}
        greeting={`Hi! I'm Aivy 👋 I know your plan for ${a.profile.name} inside out. Ask me how to set something up, what it costs, or whether it's safe — I'll take it one step at a time.`}
        suggestions={[`How do I set up the ${first.title.replace(/^AI /, "").toLowerCase()}?`, "What should I do first?", "Which tools will this cost me?", "Is this safe for customer data?", "Give me a template I can use today"]}
      />
    </div>
  );
}
