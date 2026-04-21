/**
 * GlitchEffect - Renders animated visual glitch effects in the background
 */

export interface GlitchEffectOptions {
  /** Container element for the effect (default: document.body) */
  container?: HTMLElement;
  /** Z-index for layering (default: -1) */
  zIndex?: number;
  /** Effect intensity: 'low', 'medium', 'high' (default: 'medium') */
  intensity?: 'low' | 'medium' | 'high';
  /** Target frame rate (default: 30) */
  frameRate?: number;
  /** Color scheme for glitch effect */
  colors?: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
}

export interface GlitchEffectState {
  /** Whether effect is currently rendering */
  isRunning: boolean;
  /** When effect started (ms since epoch) */
  startTime: number;
  /** Number of frames rendered */
  frameCount: number;
  /** Current effect intensity (0-1) */
  currentIntensity: number;
  /** Render method being used */
  renderMethod: 'css' | 'canvas' | 'none';
}

export class GlitchEffect {
  private options: Required<GlitchEffectOptions>;
  private isRunning: boolean = false;
  private startTime: number = 0;
  private frameCount: number = 0;
  private renderMethod: 'css' | 'canvas' | 'none' = 'none';
  private effectElement: HTMLElement | null = null;
  private animationFrameId: number | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(options: GlitchEffectOptions = {}) {
    this.options = {
      container: options.container ?? (typeof document !== 'undefined' ? document.body : null as any),
      zIndex: options.zIndex ?? -1,
      intensity: options.intensity ?? 'medium',
      frameRate: options.frameRate ?? 30,
      colors: options.colors ?? {
        primary: '#ff00ff',
        secondary: '#00ffff',
        tertiary: '#ffff00',
      },
    };

    this.detectRenderMethod();
  }

  /**
   * Start rendering the glitch effect
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = Date.now();
    this.frameCount = 0;

    this.createEffectElement();
    this.startRendering();
  }

  /**
   * Stop rendering the glitch effect
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.stopRendering();
    this.removeEffectElement();
  }

  /**
   * Check if effect is currently running
   */
  isEffectRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get current effect state
   */
  getState(): GlitchEffectState {
    return {
      isRunning: this.isRunning,
      startTime: this.startTime,
      frameCount: this.frameCount,
      currentIntensity: this.getIntensityValue(),
      renderMethod: this.renderMethod,
    };
  }

  /**
   * Check if there are active animation frames scheduled
   */
  hasActiveAnimationFrame(): boolean {
    return this.animationFrameId !== null;
  }

  /**
   * Clean up all resources
   */
  destroy(): void {
    this.stop();
    this.canvas = null;
    this.ctx = null;
  }

  private detectRenderMethod(): void {
    if (typeof window === 'undefined') {
      this.renderMethod = 'none';
      return;
    }

    // Check for CSS animation support
    const testElement = document.createElement('div');
    const hasCSSAnimation = 'animation' in testElement.style || 
                           'webkitAnimation' in testElement.style;

    if (hasCSSAnimation) {
      this.renderMethod = 'css';
      return;
    }

    // Check for Canvas support
    try {
      const testCanvas = document.createElement('canvas');
      const testCtx = testCanvas.getContext('2d');
      if (testCtx) {
        this.renderMethod = 'canvas';
        return;
      }
    } catch (error) {
      console.warn('[GlitchEffect] Canvas unavailable, using CSS fallback');
    }

    this.renderMethod = 'none';
  }

  private createEffectElement(): void {
    if (!this.options.container || typeof document === 'undefined') return;

    if (this.renderMethod === 'css') {
      this.createCSSEffect();
    } else if (this.renderMethod === 'canvas') {
      this.createCanvasEffect();
    }
  }

  private createCSSEffect(): void {
    this.effectElement = document.createElement('div');
    this.effectElement.className = 'glitch-effect-container';
    
    Object.assign(this.effectElement.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: this.options.zIndex.toString(),
      pointerEvents: 'none',
      overflow: 'hidden',
    });

    this.injectCSSAnimations();
    this.options.container.appendChild(this.effectElement);
  }

  private createCanvasEffect(): void {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'glitch-effect-canvas';
    
    Object.assign(this.canvas.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: this.options.zIndex.toString(),
      pointerEvents: 'none',
    });

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    try {
      this.ctx = this.canvas.getContext('2d');
      if (!this.ctx) {
        throw new Error('Canvas context not available');
      }
    } catch (error) {
      console.warn('[GlitchEffect] Canvas context creation failed:', error);
      this.renderMethod = 'css';
      this.createCSSEffect();
      return;
    }

    this.effectElement = this.canvas;
    this.options.container.appendChild(this.canvas);
  }

  private injectCSSAnimations(): void {
    if (typeof document === 'undefined') return;

    const styleId = 'glitch-effect-styles';
    if (document.getElementById(styleId)) return;

    const intensity = this.getIntensityValue();
    const { primary, secondary, tertiary } = this.options.colors;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes glitch-anim {
        0% {
          transform: translate(0);
          filter: hue-rotate(0deg);
        }
        20% {
          transform: translate(${2 * intensity}px, ${2 * intensity}px);
          filter: hue-rotate(${90 * intensity}deg);
        }
        40% {
          transform: translate(${-2 * intensity}px, ${-1 * intensity}px);
          filter: hue-rotate(${180 * intensity}deg);
        }
        60% {
          transform: translate(${1 * intensity}px, ${-2 * intensity}px);
          filter: hue-rotate(${270 * intensity}deg);
        }
        80% {
          transform: translate(${-1 * intensity}px, ${1 * intensity}px);
          filter: hue-rotate(${360 * intensity}deg);
        }
        100% {
          transform: translate(0);
          filter: hue-rotate(0deg);
        }
      }

      .glitch-effect-container::before,
      .glitch-effect-container::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: ${0.1 * intensity};
      }

      .glitch-effect-container::before {
        background: linear-gradient(
          ${Math.random() * 360}deg,
          ${primary} 0%,
          transparent 50%,
          ${secondary} 100%
        );
        animation: glitch-anim ${1 / intensity}s infinite;
      }

      .glitch-effect-container::after {
        background: linear-gradient(
          ${Math.random() * 360}deg,
          ${tertiary} 0%,
          transparent 50%,
          ${primary} 100%
        );
        animation: glitch-anim ${1.2 / intensity}s infinite reverse;
      }
    `;

    document.head.appendChild(style);
  }

  private removeEffectElement(): void {
    if (this.effectElement && this.effectElement.parentNode) {
      this.effectElement.parentNode.removeChild(this.effectElement);
    }
    this.effectElement = null;
    this.canvas = null;
    this.ctx = null;
  }

  private startRendering(): void {
    if (this.renderMethod === 'canvas') {
      this.renderCanvasFrame();
    }
    // CSS animations start automatically when element is added
  }

  private stopRendering(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private renderCanvasFrame = (): void => {
    if (!this.isRunning || !this.ctx || !this.canvas) return;

    const now = Date.now();
    const elapsed = now - this.startTime;
    
    // Frame rate limiting
    const frameInterval = 1000 / this.options.frameRate;
    if (elapsed < this.frameCount * frameInterval) {
      this.animationFrameId = requestAnimationFrame(this.renderCanvasFrame);
      return;
    }

    this.frameCount++;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render glitch effect
    this.renderGlitchPattern();

    this.animationFrameId = requestAnimationFrame(this.renderCanvasFrame);
  };

  private renderGlitchPattern(): void {
    if (!this.ctx || !this.canvas) return;

    const intensity = this.getIntensityValue();
    const { primary, secondary, tertiary } = this.options.colors;

    // RGB channel shift effect
    const shift = Math.random() * 10 * intensity;
    
    this.ctx.globalAlpha = 0.1 * intensity;
    
    // Draw color layers with displacement
    this.ctx.fillStyle = primary;
    this.ctx.fillRect(shift, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = secondary;
    this.ctx.fillRect(-shift, 0, this.canvas.width, this.canvas.height);
    
    // Scan lines
    for (let y = 0; y < this.canvas.height; y += 4) {
      if (Math.random() > 0.5) {
        this.ctx.fillStyle = tertiary;
        this.ctx.fillRect(0, y, this.canvas.width, 2);
      }
    }

    this.ctx.globalAlpha = 1;
  }

  private getIntensityValue(): number {
    switch (this.options.intensity) {
      case 'low':
        return 0.3;
      case 'high':
        return 1.0;
      case 'medium':
      default:
        return 0.6;
    }
  }
}
