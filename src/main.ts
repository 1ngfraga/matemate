import './styles.css'
import { preloadSprites } from './graphics/SpriteLoader'
import { setLocale } from './i18n/I18n'
import { storage } from './storage/StorageService'

preloadSprites()
setLocale(storage.loadLocale())

// Bootstrap the app
async function bootstrap() {
  const { App } = await import('./app/App')
  const appEl = document.getElementById('app')!
  const app = new App(appEl)
  app.start()
}

bootstrap().catch(console.error)
