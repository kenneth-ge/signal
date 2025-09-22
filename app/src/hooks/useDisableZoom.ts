import { useEffect } from "react"

export function useDisableZoom() {
  useEffect(() => {
    // prevent zooming and browser navigation
    const onWheel = (e: WheelEvent) => {
      // Touchpad pinches are translated into wheel with ctrl event
      if (e.ctrlKey) {
        e.preventDefault()
      }
      // Prevent browser back/forward navigation on horizontal touchpad scrolling
      if (e.deltaX !== 0) {
        e.preventDefault()
      }
    }

    document.addEventListener("wheel", onWheel, { passive: false })

    return () => document.removeEventListener("wheel", onWheel)
  }, [])
}
