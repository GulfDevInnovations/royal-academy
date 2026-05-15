// src/app/[locale]/enrollment/page.tsx
import { getSubClassCards } from '@/lib/actions/classes';
import { EnrollmentCardsClient } from './_components/EnrollmentCardsClient';
import { SuccessToast } from './_components/SuccessToast';
import { Suspense } from 'react';

export const metadata = {
  title: 'Enroll in a Class | Royal Academy',
  description: 'Discover and book classes at Royal Academy',
};

export default async function EnrollmentPage() {
  const subClasses = await getSubClassCards();

  return (
    <>
      <EnrollmentCardsClient subClasses={subClasses} />
      <Suspense>
        <SuccessToast />
      </Suspense>
    </>
  );
}
