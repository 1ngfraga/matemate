import './styles.css'

// Rotate notice for portrait mobile
const rotateNotice = document.createElement('div')
rotateNotice.id = 'rotate-notice'
rotateNotice.innerHTML = `
  <div class="rotate-icon">📱</div>
  <div>Gira tu dispositivo<br>para jugar MateMate</div>
`
document.body.appendChild(rotateNotice)

// Bootstrap the app
async function bootstrap() {
  const { App } = await import('./app/App')
  const appEl = document.getElementById('app')!
  const app = new App(appEl)
  app.start()
}

bootstrap().catch(console.error)
