'use client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BusinessInfoData {
  company_name: string
  company_size: string
  tech_maturity: string
  current_tools: string
}

export interface BusinessInfoStepProps {
  data: BusinessInfoData
  onChange: (data: BusinessInfoData) => void
  errors: Record<string, string>
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COMPANY_SIZE_OPTIONS = [
  { value: '1-10', label: '1-10' },
  { value: '11-50', label: '11-50' },
  { value: '51-200', label: '51-200' },
  { value: '201-500', label: '201-500' },
  { value: '500+', label: '500+' },
] as const

const TECH_MATURITY_OPTIONS = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
] as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BusinessInfoStep({ data, onChange, errors }: BusinessInfoStepProps) {
  function handleChange(field: keyof BusinessInfoData, value: string) {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      {/* Company Name */}
      <div>
        <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
          Nome da empresa <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="company_name"
          value={data.company_name}
          onChange={(e) => handleChange('company_name', e.target.value)}
          aria-required="true"
          aria-invalid={!!errors.company_name}
          aria-describedby={errors.company_name ? 'company_name-error' : undefined}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ex: Acme Ltda"
        />
        {errors.company_name && (
          <p id="company_name-error" role="alert" className="mt-1 text-sm text-red-600">
            {errors.company_name}
          </p>
        )}
      </div>

      {/* Company Size */}
      <div>
        <label htmlFor="company_size" className="block text-sm font-medium text-gray-700">
          Tamanho (funcionários) <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <select
          id="company_size"
          value={data.company_size}
          onChange={(e) => handleChange('company_size', e.target.value)}
          aria-required="true"
          aria-invalid={!!errors.company_size}
          aria-describedby={errors.company_size ? 'company_size-error' : undefined}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Selecione...</option>
          {COMPANY_SIZE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.company_size && (
          <p id="company_size-error" role="alert" className="mt-1 text-sm text-red-600">
            {errors.company_size}
          </p>
        )}
      </div>

      {/* Tech Maturity */}
      <div>
        <label htmlFor="tech_maturity" className="block text-sm font-medium text-gray-700">
          Maturidade tecnológica <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <select
          id="tech_maturity"
          value={data.tech_maturity}
          onChange={(e) => handleChange('tech_maturity', e.target.value)}
          aria-required="true"
          aria-invalid={!!errors.tech_maturity}
          aria-describedby={errors.tech_maturity ? 'tech_maturity-error' : undefined}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Selecione...</option>
          {TECH_MATURITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.tech_maturity && (
          <p id="tech_maturity-error" role="alert" className="mt-1 text-sm text-red-600">
            {errors.tech_maturity}
          </p>
        )}
      </div>

      {/* Current Tools */}
      <div>
        <label htmlFor="current_tools" className="block text-sm font-medium text-gray-700">
          Ferramentas atuais
        </label>
        <textarea
          id="current_tools"
          value={data.current_tools}
          onChange={(e) => handleChange('current_tools', e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ex: Slack, Google Workspace, Trello..."
        />
        {errors.current_tools && (
          <p id="current_tools-error" role="alert" className="mt-1 text-sm text-red-600">
            {errors.current_tools}
          </p>
        )}
      </div>
    </div>
  )
}
