interface FamilyHelpButtonProps {
  onClick?: () => void
}

export function FamilyHelpButton({ onClick }: FamilyHelpButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-light text-primary border border-purple-100 font-bold text-lg hover:bg-purple-100 transition-colors shadow-sm min-w-max"
    >
      <span className="material-symbols-outlined text-xl">
        family_star
      </span>
      Pedir ayuda a mi familia
    </button>
  )
}
