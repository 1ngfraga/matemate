import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.matemate.app',
  appName: 'MateMate',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    backgroundColor: '#0a0a1a',
    allowMixedContent: false,
    captureInput: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1200,
      backgroundColor: '#0a0a1aff',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: '#0a0a1a',
    },
  },
}

export default config
