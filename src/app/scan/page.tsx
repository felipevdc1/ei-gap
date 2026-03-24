import { getSectorProfiles } from '@/lib/data/loader'
import { ScanForm } from './components/ScanForm'

export const metadata = {
  title: 'AI Gap Scanner | EI-GAP',
  description: 'Discover AI automation opportunities for your business',
}

export default function ScanPage() {
  const { sectors, generic } = getSectorProfiles()

  return (
    <main className="min-h-screen">
      <ScanForm sectors={sectors} generic={generic} />
    </main>
  )
}
