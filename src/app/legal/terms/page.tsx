import Link from "next/link";
import { Logo } from "@/components/brand";

export const metadata = { title: "Terms of service" };

export default function Page() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <Logo />
      <h1 className="mt-10 text-3xl font-extrabold">Terms of service</h1>
      <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-amber-900">Placeholder. This page must be written and reviewed by a qualified adviser before Aivy launches publicly.</p>
      <Link href="/" className="mt-8 inline-block font-semibold text-violet-700">← Back home</Link>
    </main>
  );
}
