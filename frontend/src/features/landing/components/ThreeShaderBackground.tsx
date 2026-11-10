import React, { Suspense, useEffect, useState } from 'react'

interface ThreeShaderProps {
  className?: string
}

class ErrorBoundary extends React.Component<{ fallback: React.ReactNode; children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  override render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

const LazyAmberShader = React.lazy<React.ComponentType<Record<string, unknown>>>(async () => {
  try {
    const mod = await import('@designcodeio/threeui/components/AmberHalftone')
    return { default: mod.AmberHalftone }
  } catch {
    return {
      default: () => <div />,
    }
  }
})

export const ThreeShaderBackground: React.FC<ThreeShaderProps> = ({ className }) => {
  const [shouldRender3D, setShouldRender3D] = useState(false)

  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024
    const hasCores = (navigator.hardwareConcurrency || 1) >= 4
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (isDesktop && hasCores && !prefersReducedMotion) {
      setShouldRender3D(true)
    }
  }, [])

  const staticFallback = (
    <div
      className="library-ambient-glow"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 65% 55% at 50% 25%, rgba(176, 141, 60, 0.18) 0%, rgba(243, 236, 220, 0) 70%),
          radial-gradient(ellipse 50% 40% at 80% 85%, rgba(31, 58, 46, 0.08) 0%, rgba(243, 236, 220, 0) 60%),
          radial-gradient(ellipse 45% 35% at 15% 75%, rgba(122, 46, 43, 0.06) 0%, rgba(243, 236, 220, 0) 60%)
        `,
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  )

  if (!shouldRender3D) {
    return staticFallback
  }

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.45,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      <ErrorBoundary fallback={staticFallback}>
        <Suspense fallback={staticFallback}>
          <LazyAmberShader
            speed={0.6}
            density={0.8}
            opacity={0.35}
            hue={38}
            saturation={0.7}
            brightness={1.1}
            style={{ width: '100%', height: '100%' }}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
