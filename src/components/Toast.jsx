import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export function useToast() {
  const [msg, setMsg] = useState('')
  const timer = useRef(null)

  const show = useCallback((text) => {
    setMsg(text)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMsg(''), 3200)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  const node = useMemo(
    () => (msg ? <div className="toast show">{msg}</div> : <div className="toast" />),
    [msg],
  )

  // Stable identity: safe to list in effect dependencies.
  return useMemo(() => ({ show, node }), [show, node])
}
