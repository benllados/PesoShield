'use client'

import { useState } from 'react'
import { FamilyHelpButton } from './FamilyHelpButton'
import { FamilyHelpModal } from './FamilyHelpModal'
import { buildGenericHelpMessage } from '@/lib/build-help-message'

export function DashboardHelpButton() {
  const [open, setOpen] = useState(false)
  const message = buildGenericHelpMessage()

  return (
    <>
      <FamilyHelpButton onClick={() => setOpen(true)} />
      <FamilyHelpModal
        open={open}
        onClose={() => setOpen(false)}
        message={message}
      />
    </>
  )
}
