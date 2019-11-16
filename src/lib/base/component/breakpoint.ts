import { Component } from 'vue-property-decorator'
import Vue from 'vue'

export enum BreakpointName {
  xs = 'xs',
  sm = 'sm',
  md = 'md',
  lg = 'lg',
  xl = 'xl',
}

export interface BreakpointInfo {
  name: BreakpointName
  xs: boolean
  sm: boolean
  md: boolean
  lg: boolean
  xl: boolean
  xsOnly: boolean
  smOnly: boolean
  smAndDown: boolean
  smAndUp: boolean
  mdOnly: boolean
  mdAndDown: boolean
  mdAndUp: boolean
  lgOnly: boolean
  lgAndDown: boolean
  lgAndUp: boolean
  xlOnly: boolean
  width: number
  height: number
}

@Component
export class Breakpoint extends Vue {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  get breakpoint(): BreakpointInfo {
    const xs = this.Breakpoint_clientWidth < 600
    const sm = this.Breakpoint_clientWidth < 960 && !xs
    const md = this.Breakpoint_clientWidth < 1280 - 16 && !(sm || xs)
    const lg = this.Breakpoint_clientWidth < 1920 - 16 && !(md || sm || xs)
    const xl = this.Breakpoint_clientWidth >= 1920 - 16 && !(lg || md || sm || xs)

    const xsOnly = xs
    const smOnly = sm
    const smAndDown = (xs || sm) && !(md || lg || xl)
    const smAndUp = !xs && (sm || md || lg || xl)
    const mdOnly = md
    const mdAndDown = (xs || sm || md) && !(lg || xl)
    const mdAndUp = !(xs || sm) && (md || lg || xl)
    const lgOnly = lg
    const lgAndDown = (xs || sm || md || lg) && !xl
    const lgAndUp = !(xs || sm || md) && (lg || xl)
    const xlOnly = xl

    let name: BreakpointName
    switch (true) {
      case xs:
        name = BreakpointName.xs
        break
      case sm:
        name = BreakpointName.sm
        break
      case md:
        name = BreakpointName.md
        break
      case lg:
        name = BreakpointName.lg
        break
      default:
        name = BreakpointName.xl
        break
    }

    return {
      // Definite breakpoint.
      xs,
      sm,
      md,
      lg,
      xl,

      // Useful e.g. to construct CSS class names dynamically.
      name,

      // Breakpoint ranges.
      xsOnly,
      smOnly,
      smAndDown,
      smAndUp,
      mdOnly,
      mdAndDown,
      mdAndUp,
      lgOnly,
      lgAndDown,
      lgAndUp,
      xlOnly,

      // For custom breakpoint logic.
      width: this.Breakpoint_clientWidth,
      height: this.Breakpoint_clientHeight,
    }
  }

  get screenSize(): { pc: boolean; tab: boolean; sp: boolean } {
    return {
      pc: this.breakpoint.xl || this.breakpoint.lg || this.breakpoint.md,
      tab: this.breakpoint.sm,
      sp: this.breakpoint.xs,
    }
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  Breakpoint_clientWidth: number = this.Breakpoint_getClientDimensionsWidth()
  Breakpoint_clientHeight: number = this.Breakpoint_getClientDimensionsHeight()
  Breakpoint_resizeTimeout: number = 0

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected Breakpoint_windowOnResize() {
    clearTimeout(this.Breakpoint_resizeTimeout)

    // Added debounce to match what
    // v-resize used to do but was
    // removed due to a memory leak
    // https://github.com/vuetifyjs/vuetify/pull/2997
    this.Breakpoint_resizeTimeout = window.setTimeout(() => {
      this.Breakpoint_clientWidth = this.Breakpoint_getClientDimensionsWidth()
      this.Breakpoint_clientHeight = this.Breakpoint_getClientDimensionsHeight()
    }, 200)
  }

  // Cross-browser support as described in:
  // https://stackoverflow.com/questions/1248081
  private Breakpoint_getClientDimensionsWidth(): number {
    if (typeof document === 'undefined') return 0 // SSR
    return Math.max(document.documentElement!.clientWidth, window.innerWidth || 0)
  }

  // Cross-browser support as described in:
  // https://stackoverflow.com/questions/1248081
  private Breakpoint_getClientDimensionsHeight(): number {
    if (typeof document === 'undefined') return 0 // SSR
    return Math.max(document.documentElement!.clientHeight, window.innerHeight || 0)
  }
}
