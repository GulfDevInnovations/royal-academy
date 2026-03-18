import Image from "next/image";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  return (
    <main className="fixed inset-0">
      <Image
        src="/images/academy_default.png"
        alt="Royal Academy"
        fill
        priority
        sizes="100vw"
        style={{ objectFit: "cover" }}
      />
    </main>
  );
}
