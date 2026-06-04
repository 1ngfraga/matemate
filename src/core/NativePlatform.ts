import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Screen } from './Types'

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

export async function configureNativeShell(): Promise<void> {
  if (!isNativeApp()) return

  try {
    await StatusBar.setOverlaysWebView({ overlay: false })
    await StatusBar.setBackgroundColor({ color: '#0a0a1a' })
    await StatusBar.setStyle({ style: Style.Light })
  } catch {
    // Ignore platform-specific shell failures.
  }

  try {
    await SplashScreen.hide()
  } catch {
    // Ignore if splash already hid automatically.
  }
}

export async function exitNativeApp(): Promise<void> {
  if (!isNativeApp()) return
  await CapacitorApp.exitApp()
}

export function addNativeBackButtonListener(
  resolveBackTarget: () => Screen,
  onBack: (screen: Screen) => void | Promise<void>,
): void {
  if (!isNativeApp()) return

  CapacitorApp.addListener('backButton', async () => {
    const target = resolveBackTarget()
    if (target === Screen.Welcome) {
      await exitNativeApp()
      return
    }
    await onBack(target)
  })
}
