// // src/app/[locale]/reservation/page.tsx
// import { getSessionsForMonth } from "@/lib/actions/reservation";
// import { ReservationPageClient } from "./_components/ReservationPageClient";

// export const metadata = {
//   title: "Reserve a Class | Royal Academy",
//   description: "Browse and book classes at Royal Academy",
// };

// export default async function ReservationPage({
//   searchParams,
// }: {
//   searchParams: Promise<{ sessionId?: string; date?: string }>;
// }) {
//   const params = await searchParams;
//   const now = new Date();

//   // Fetch current month sessions on server
//   const sessions = await getSessionsForMonth(now.getFullYear(), now.getMonth());

//   return (
//     <ReservationPageClient
//       initialSessions={sessions}
//       preSelectedSessionId={params.sessionId}
//       preSelectedDate={params.date}
//     />
//   );
// }

// src/app/[locale]/reservation/page.tsx
import { getSubClassCards } from "@/lib/actions/classes";
import { ReservationCardsClient } from "./_components/ReservationCardsClient";
import { SuccessToast } from "./_components/SuccessToast";
import { Suspense } from "react";

export const metadata = {
  title: "Reserve a Class | Royal Academy",
  description: "Discover and book classes at Royal Academy",
};

export default async function ReservationPage() {
  const subClasses = await getSubClassCards();

  return (
    <>
      <ReservationCardsClient subClasses={subClasses} />
      <Suspense>
        <SuccessToast />
      </Suspense>
    </>
  );
}
