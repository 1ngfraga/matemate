export class App {
  constructor(private root: HTMLElement) {}

  start() {
    this.root.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        gap: 24px;
        font-family: 'Courier New', monospace;
        color: #f0c040;
      ">
        <div style="font-size: 48px;">🦕</div>
        <div style="font-size: 32px; letter-spacing: 4px;">MATEMATE</div>
        <div style="font-size: 14px; color: #8888aa;">Scaffold OK — Step 1 completo</div>
      </div>
    `
  }
}
