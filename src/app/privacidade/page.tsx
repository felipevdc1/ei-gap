// ---------------------------------------------------------------------------
// EI-GAP — Politica de Privacidade
// Story E5.S3 — LGPD Compliance
// ---------------------------------------------------------------------------
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politica de Privacidade — EI-GAP AI Scanner',
  description:
    'Politica de privacidade do EI-GAP AI Scanner conforme a LGPD.',
}

export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">
        Politica de Privacidade — EI-GAP AI Scanner
      </h1>

      {/* 1. Dados Coletados */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-gray-800">
          1. Dados Coletados
        </h2>
        <p className="text-gray-700 leading-relaxed">
          Coletamos os seguintes dados durante o uso do EI-GAP AI Scanner: nome
          da empresa, setor, porte, maturidade tecnologica, ferramentas atuais,
          processos de negocio, respostas do questionario, email (quando
          fornecido voluntariamente), nome e empresa do contato.
        </p>
      </section>

      {/* 2. Finalidade */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-gray-800">
          2. Finalidade
        </h2>
        <p className="text-gray-700 leading-relaxed">
          Os dados sao utilizados para a geracao de diagnostico personalizado de
          oportunidades de IA para sua empresa. O contato comercial ocorre
          apenas quando o usuario fornece seu email voluntariamente.
        </p>
      </section>

      {/* 3. Compartilhamento */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-gray-800">
          3. Compartilhamento
        </h2>
        <p className="text-gray-700 leading-relaxed">
          Os dados do formulario sao enviados ao OpenRouter (provedor de IA)
          para processamento do diagnostico. Nenhum dado pessoal e compartilhado
          com terceiros para fins de marketing.
        </p>
      </section>

      {/* 4. Retencao */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-gray-800">
          4. Retencao
        </h2>
        <ul className="list-disc pl-6 text-gray-700 leading-relaxed space-y-2">
          <li>
            Diagnosticos sem captura de lead: retidos por <strong>90 dias</strong>.
          </li>
          <li>
            Diagnosticos com lead capturado: mantidos ate solicitacao de exclusao
            pelo titular.
          </li>
        </ul>
      </section>

      {/* 5. Seus Direitos */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-gray-800">
          5. Seus Direitos
        </h2>
        <p className="text-gray-700 leading-relaxed">
          Voce tem direito a acesso, correcao, exclusao e portabilidade dos seus
          dados. Para exercer seus direitos, entre em contato pelo email{' '}
          <a
            href="mailto:privacidade@ei-gap.com.br"
            className="text-blue-600 underline hover:text-blue-800"
          >
            privacidade@ei-gap.com.br
          </a>
          .
        </p>
      </section>

      {/* 6. Base Legal */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-gray-800">
          6. Base Legal
        </h2>
        <p className="text-gray-700 leading-relaxed">
          O tratamento dos dados e realizado com base no consentimento explicito
          do titular, conforme o Art. 7, inciso I da LGPD (Lei Geral de
          Protecao de Dados Pessoais).
        </p>
      </section>
    </main>
  )
}
