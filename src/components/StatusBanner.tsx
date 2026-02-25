interface StatusBannerProps {
  budgetHealthy: boolean
  title: string
  message: string
}

export function StatusBanner({ budgetHealthy, title, message }: StatusBannerProps) {
  return (
    <div
      className={`rounded-lg p-6 md:p-8 flex items-start gap-4 shadow-sm ${
        budgetHealthy
          ? 'bg-bien-bg border border-bien/20'
          : 'bg-ojo-bg border border-ojo/20'
      }`}
    >
      <div
        className={`bg-surface rounded-full p-2 flex-shrink-0 shadow-sm ${
          budgetHealthy ? 'text-bien' : 'text-ojo'
        }`}
      >
        <span
          className="material-symbols-outlined text-4xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {budgetHealthy ? 'check_circle' : 'warning'}
        </span>
      </div>
      <div>
        <h3
          className={`text-2xl font-bold mb-2 ${
            budgetHealthy ? 'text-bien' : 'text-ojo'
          }`}
        >
          {title}
        </h3>
        <p className="text-xl text-text-primary leading-relaxed">{message}</p>
      </div>
    </div>
  )
}
