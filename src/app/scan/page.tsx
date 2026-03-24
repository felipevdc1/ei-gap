import { getSectorProfiles } from '@/lib/data/loader'
import { ScanPageClient } from './components/ScanPageClient'

export const metadata = {
  title: 'AI Gap Scanner | EI-GAP',
  description: 'Discover AI automation opportunities for your business',
}

export default function ScanPage() {
  const { sectors, generic } = getSectorProfiles()

  return (
    <main className="min-h-screen">
      <ScanPageClient sectors={sectors} generic={generic} />
    </main>
  )
}
