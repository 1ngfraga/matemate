import { isNativeApp } from './NativePlatform'

function isWindowsDesktop(): boolean {
  const ua = navigator.userAgent.toLowerCase()
  const platform = (navigator.platform ?? '').toLowerCase()
  const isWindows = ua.includes('windows') || platform.startsWith('win')
  const hasTouch = navigator.maxTouchPoints > 0
  return isWindows && !hasTouch
}

export function shouldUseFullscreen(): boolean {
  if (isNativeApp()) return false
  if (isWindowsDesktop()) return false
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) <= 1024
  const hasTouch = navigator.maxTouchPoints > 0
  return coarsePointer || (hasTouch && smallScreen)
}

export async function requestFullscreen(el: HTMLElement): Promise<void> {
  if (!shouldUseFullscreen()) return
  if (el.requestFullscreen) {
    return el.requestFullscreen()
  }
  // Safari
  const s = el as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }
  if (s.webkitRequestFullscreen) {
    return s.webkitRequestFullscreen()
  }
}

export function exitFullscreen(): void {
  if (document.exitFullscreen) {
    document.exitFullscreen().catch(() => {})
  }
}

export function isFullscreen(): boolean {
  return !!document.fullscreenElement
}
