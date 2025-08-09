import { useMediaQuery } from "./useMediaQuery.js";

const PHONE_PORTRAIT_BREAKPOINT = 600;

export function usePhonePortrait(): boolean {
    return useMediaQuery(`(max-width: ${PHONE_PORTRAIT_BREAKPOINT}px) and (orientation: portrait)`);
  }