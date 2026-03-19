import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  Renderer2,
  inject,
} from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnDestroy {
  @Input('appTooltip') text = '';
  /** 'top' | 'bottom' | 'left' | 'right' */
  @Input() tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';

  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  private tooltipEl: HTMLElement | null = null;
  private showTimeout: ReturnType<typeof setTimeout> | null = null;

  @HostListener('mouseenter') onEnter() {
    if (!this.text?.trim()) return;
    this.showTimeout = setTimeout(() => this.create(), 80);
  }

  @HostListener('mouseleave') onLeave() {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    this.remove();
  }

  @HostListener('click') onClick() {
    this.remove();
  }

  private create() {
    if (this.tooltipEl) return;

    const tip = this.renderer.createElement('div') as HTMLElement;
    tip.className = 'app-tooltip';
    tip.textContent = this.text;

    Object.assign(tip.style, {
      position: 'fixed',
      zIndex: '99999',
      padding: '5px 11px',
      borderRadius: '7px',
      background: 'rgba(15, 23, 42, 0.90)',
      color: '#fff',
      fontSize: '11.5px',
      fontWeight: '600',
      lineHeight: '1.4',
      letterSpacing: '0.01em',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
      backdropFilter: 'blur(6px)',
      opacity: '0',
      transform: 'translateY(4px)',
      transition: 'opacity 0.15s ease, transform 0.15s ease',
    });

    // Arrow element
    const arrow = this.renderer.createElement('span') as HTMLElement;
    Object.assign(arrow.style, {
      position: 'absolute',
      width: '0',
      height: '0',
      borderStyle: 'solid',
    });

    this.renderer.appendChild(tip, arrow);
    this.renderer.appendChild(document.body, tip);
    this.tooltipEl = tip;

    // Position after paint
    requestAnimationFrame(() => {
      if (!this.tooltipEl) return;
      const host = (this.el.nativeElement as HTMLElement).getBoundingClientRect();
      const t = this.tooltipEl.getBoundingClientRect();

      let top = 0, left = 0;
      const GAP = 8;

      switch (this.tooltipPosition) {
        case 'bottom':
          top = host.bottom + GAP;
          left = host.left + host.width / 2 - t.width / 2;
          Object.assign(arrow.style, {
            top: '-5px', left: '50%', marginLeft: '-5px',
            borderWidth: '0 5px 5px', borderColor: 'transparent transparent rgba(15,23,42,.9)',
          });
          break;
        case 'left':
          top = host.top + host.height / 2 - t.height / 2;
          left = host.left - t.width - GAP;
          Object.assign(arrow.style, {
            top: '50%', right: '-5px', marginTop: '-5px',
            borderWidth: '5px 0 5px 5px', borderColor: 'transparent transparent transparent rgba(15,23,42,.9)',
          });
          break;
        case 'right':
          top = host.top + host.height / 2 - t.height / 2;
          left = host.right + GAP;
          Object.assign(arrow.style, {
            top: '50%', left: '-5px', marginTop: '-5px',
            borderWidth: '5px 5px 5px 0', borderColor: 'transparent rgba(15,23,42,.9) transparent transparent',
          });
          break;
        default: // top
          top = host.top - t.height - GAP;
          left = host.left + host.width / 2 - t.width / 2;
          Object.assign(arrow.style, {
            bottom: '-5px', left: '50%', marginLeft: '-5px',
            borderWidth: '5px 5px 0', borderColor: 'rgba(15,23,42,.9) transparent transparent',
          });
      }

      // Clamp to viewport
      left = Math.max(8, Math.min(left, window.innerWidth - t.width - 8));
      top = Math.max(8, Math.min(top, window.innerHeight - t.height - 8));

      this.tooltipEl.style.top = `${top}px`;
      this.tooltipEl.style.left = `${left}px`;

      // Fade in
      requestAnimationFrame(() => {
        if (this.tooltipEl) {
          this.tooltipEl.style.opacity = '1';
          this.tooltipEl.style.transform = 'translateY(0)';
        }
      });
    });
  }

  private remove() {
    if (this.tooltipEl) {
      this.tooltipEl.remove();
      this.tooltipEl = null;
    }
  }

  ngOnDestroy() {
    this.remove();
    if (this.showTimeout) clearTimeout(this.showTimeout);
  }
}
