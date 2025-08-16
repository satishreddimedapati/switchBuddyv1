import * as React from "react"
import { useAuth } from "@/lib/auth";

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const { viewMode } = useAuth();
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    if (viewMode !== 'auto') {
        setIsMobile(viewMode === 'mobile');
        return;
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [viewMode])

  return !!isMobile
}
