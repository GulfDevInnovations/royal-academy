import HomeClientV2 from "@/components/home/v2/HomeClientV2";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  return <HomeClientV2 />;
}
