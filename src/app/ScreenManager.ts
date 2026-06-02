export interface BaseScreen {
  mount(container: HTMLElement): void
  unmount(): void
}

export class ScreenManager {
  private current: BaseScreen | null = null
  private wrapper: HTMLElement

  constructor(private root: HTMLElement) {
    this.wrapper = document.createElement('div')
    this.wrapper.style.cssText = 'width:100%;height:100%;position:relative;'
    this.root.appendChild(this.wrapper)
  }

  async show(next: BaseScreen): Promise<void> {
    const prev = this.current

    // Mount next screen (hidden behind prev)
    const nextEl = document.createElement('div')
    nextEl.className = 'screen'
    nextEl.style.opacity = '0'
    this.wrapper.appendChild(nextEl)
    next.mount(nextEl)
    this.current = next

    if (prev) {
      // Fade out old, fade in new simultaneously
      await this.animate(nextEl, 'in')
      // Unmount previous after transition
      prev.unmount()
      // Remove all children except the new screen element
      Array.from(this.wrapper.children).forEach((child) => {
        if (child !== nextEl) this.wrapper.removeChild(child)
      })
    } else {
      await this.animate(nextEl, 'in')
    }
  }

  private animate(el: HTMLElement, direction: 'in' | 'out'): Promise<void> {
    return new Promise((resolve) => {
      const duration = 180
      if (direction === 'in') {
        el.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`
        el.style.transform = 'translateY(6px)'
        el.style.opacity = '0'
        // Force reflow
        void el.offsetHeight
        el.style.opacity = '1'
        el.style.transform = 'translateY(0)'
      } else {
        el.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`
        el.style.opacity = '0'
        el.style.transform = 'translateY(-6px)'
      }
      setTimeout(resolve, duration)
    })
  }
}
