import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/landing/HeroSection'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { ValueCards } from '@/components/landing/ValueCards'
import { SectorShowcase } from '@/components/landing/SectorShowcase'
import { CtaSection } from '@/components/landing/CtaSection'
import { getSectorProfiles } from '@/lib/data/loader'

// ---------------------------------------------------------------------------
// SEO — Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'EI-GAP — Descubra as Oportunidades de IA para seu Negócio',
  description:
    'Diagnóstico gratuito e personalizado de inteligência artificial. Identifique as 10 maiores oportunidades de IA para o seu negócio em minutos.',
  openGraph: {
    title: 'EI-GAP — Descubra as Oportunidades de IA para seu Negócio',
    description:
      'Diagnóstico gratuito e personalizado de inteligência artificial. Identifique as 10 maiores oportunidades de IA para o seu negócio em minutos.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'EI-GAP AI Scanner',
      },
    ],
    type: 'website',
    locale: 'pt_BR',
  },
}

// ---------------------------------------------------------------------------
// SEO — JSON-LD Structured Data
// ---------------------------------------------------------------------------

export const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'EI-GAP AI Scanner',
  description:
    'Diagnóstico gratuito e personalizado de inteligência artificial para empresas.',
  url: 'https://ei-gap.com',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'BRL',
  },
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function Home() {
  const { sectors } = getSectorProfiles()
  const sectorNames = sectors.map((s) => s.name)

  return (
    <>
      <Header />
      <main id="main-content">
        <HeroSection />
        <HowItWorks />
        <ValueCards />
        <SectorShowcase sectors={sectorNames} />
        <CtaSection />
      </main>
      <Footer />

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  )
}
