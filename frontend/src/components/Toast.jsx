import React, { useEffect } from 'react'

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [toast, onClose])

  if (!toast) return null
  return (
    <div key={toast.message + Date.now()} className={`toast ${toast.type || 'success'}`}>
      <div>{toast.message}</div>
      <div className="toast-bar" />
    </div>
  )
}
