export async function requestFullscreen(el: HTMLElement): Promise<void> {
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
