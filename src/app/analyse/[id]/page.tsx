import Image from "next/image";
import type { Metadata } from "next";
import { Logo } from "@/components/brand";
import { AnalysisExperience } from "./analysis-experience";

export const metadata: Metadata = { title: "Analysing your business", robots: { index: false } };

export default async function AnalysePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-night-900">
      <Image src="/aivy/hero-bg.webp" alt="" fill priority sizes="100vw" className="-z-20 object-cover opacity-50" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-night-900/80 via-night-900/70 to-night-900" />
      <header className="absolute inset-x-0 top-0 z-10 mx-auto flex max-w-6xl px-5 py-6 sm:px-8">
        <Logo dark />
      </header>
      <AnalysisExperience id={id} />
    </main>
  );
}
