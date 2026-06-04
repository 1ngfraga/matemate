import './styles.css'
import { preloadSprites } from './graphics/SpriteLoader'

preloadSprites()

// Bootstrap the app
async function bootstrap() {
  const { App } = await import('./app/App')
  const appEl = document.getElementById('app')!
  const app = new App(appEl)
  app.start()
}

bootstrap().catch(console.error)
