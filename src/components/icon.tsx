import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FileText,
  Inbox,
  Layers,
  LineChart,
  Mail,
  Megaphone,
  MessageCircle,
  Mic,
  Receipt,
  Send,
  Star,
  Tag,
  Target,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";

const ICONS: Record<string, LucideIcon> = {
  calendar: CalendarDays,
  message: MessageCircle,
  inbox: Inbox,
  megaphone: Megaphone,
  mail: Mail,
  star: Star,
  chart: LineChart,
  target: Target,
  send: Send,
  file: FileText,
  book: BookOpen,
  layers: Layers,
  receipt: Receipt,
  mic: Mic,
  tag: Tag,
  bar: BarChart3,
};

export function PlaybookIcon({ name, className, size = "md" }: { name: string; className?: string; size?: "sm" | "md" | "lg" }) {
  const I = ICONS[name] ?? Star;
  const box = { sm: "h-9 w-9 rounded-xl", md: "h-12 w-12 rounded-2xl", lg: "h-14 w-14 rounded-2xl" }[size];
  const ic = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" }[size];
  return (
    <span className={clsx("inline-flex shrink-0 items-center justify-center bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_16px_-8px_rgba(109,61,245,0.8)]", box, className)}>
      <I className={ic} strokeWidth={2.2} />
    </span>
  );
}
