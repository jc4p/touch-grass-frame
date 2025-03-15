import { Suspense } from 'react';
import HomeComponent from '../components/HomeComponent';
import { generateMetadata as generatePageMetadata } from '../lib/metadata';

// Generate dynamic metadata based on the request
export async function generateMetadata({ searchParams }) {
  const imageParam = (await searchParams)?.image;
  return generatePageMetadata(imageParam);
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeComponent />
    </Suspense>
  );
}
