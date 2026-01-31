import { useParams } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { ShinyCounter } from '@/components/counter/ShinyCounter';

export default function Counter() {
  const { huntId } = useParams<{ huntId?: string }>();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto py-8 px-4">
        <ShinyCounter huntId={huntId} />
      </main>
    </div>
  );
}
