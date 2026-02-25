import type { Alert } from '@/lib/types'

const SEVERITY_STYLES: Record<
  Alert['severity'],
  { bg: string; border: string; titleColor: string; iconBg: string; iconColor: string }
> = {
  critical: {
    bg: 'bg-ojo-bg',
    border: 'border-ojo/20',
    titleColor: 'text-ojo',
    iconBg: 'bg-surface',
    iconColor: 'text-ojo',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-300/30',
    titleColor: 'text-amber-700',
    iconBg: 'bg-surface',
    iconColor: 'text-amber-600',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-300/30',
    titleColor: 'text-blue-700',
    iconBg: 'bg-surface',
    iconColor: 'text-blue-600',
  },
}

interface AlertBannerProps {
  alert: Alert
  onDismiss: (id: string) => void
}

export function AlertBanner({ alert, onDismiss }: AlertBannerProps) {
  const styles = SEVERITY_STYLES[alert.severity]

  return (
    <div
      className={`rounded-lg p-5 md:p-6 flex items-start gap-4 shadow-sm ${styles.bg} border ${styles.border}`}
    >
      <div
        className={`${styles.iconBg} rounded-full p-2 flex-shrink-0 shadow-sm ${styles.iconColor}`}
      >
        <span
          className="material-symbols-outlined text-3xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {alert.icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`text-xl font-bold mb-1 ${styles.titleColor}`}>
          {alert.title}
        </h3>
        <p className="text-lg text-text-primary leading-relaxed">
          {alert.message}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(alert.id)}
        className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/50 transition-colors shrink-0"
        aria-label="Cerrar alerta"
      >
        <span className="material-symbols-outlined text-xl">close</span>
      </button>
    </div>
  )
}
