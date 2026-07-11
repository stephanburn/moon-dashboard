import Dashboard from '@/components/Dashboard';

// ISR so the OG <meta> tag (whose image URL is date-stamped by
// generateImageMetadata in opengraph-image.tsx) advances daily for fresh shares.
export const revalidate = 3600;

export default function Home() {
  return <Dashboard />;
}
