import { Suspense } from 'react';
import HomeComponent from '../components/HomeComponent';
import { generateMetadata as generatePageMetadata } from '../lib/metadata';

// Generate dynamic metadata based on the request
export async function generateMetadata({ searchParams }) {
  const imageParam = (await searchParams)?.image;
  const overlayId = (await searchParams)?.overlay;
  return generatePageMetadata(imageParam, overlayId);
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeComponent />
    </Suspense>
  );
}
