import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Monitor, Smartphone, Tablet } from 'lucide-react'
import { cn } from '@/kit/lib/cn'
import { Segmented } from '@/kit/components/nav/Segmented'

export type PreviewDevice = 'phone' | 'tablet' | 'desktop'

/** Width of the page inside the frame, in CSS px. */
const WIDTH: Record<PreviewDevice, number> = { phone: 375, tablet: 768, desktop: 1100 }

interface PreviewFrameProps {
  children: ReactNode
  device?: PreviewDevice
  /** Shows a device switch above the frame when given. */
  onDeviceChange?: (device: PreviewDevice) => void
  /** Height of the frame's screen in CSS px (before scaling). */
  height?: number
  /** Names the preview for screen readers. */
  label?: string
  className?: string
}

/**
 * Shows its children as a page on a device: the content is laid out at the device's real width, then scaled down to fit
 * the space it has. Use it to preview what a visitor will see, next to the editor.
 */
export function PreviewFrame({ children, device = 'phone', onDeviceChange, height = 640, label = 'Preview', className }: PreviewFrameProps) {
  const holder = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const width = WIDTH[device]

  useLayoutEffect(() => {
    const el = holder.current
    if (!el) return
    const fit = () => setScale(Math.min(1, el.clientWidth / width))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [width])

  return (
    <div className={cn('preview', className)}>
      {onDeviceChange && (
        <Segmented<PreviewDevice>
          ariaLabel="Preview device"
          value={device}
          onChange={onDeviceChange}
          options={[
            { value: 'phone', label: <Smartphone aria-label="Phone" /> },
            { value: 'tablet', label: <Tablet aria-label="Tablet" /> },
            { value: 'desktop', label: <Monitor aria-label="Desktop" /> },
          ]}
        />
      )}
      <div ref={holder} className="preview-holder" data-device={device}>
        <div className="preview-device" style={{ width: width * scale, height: height * scale }}>
          <div
            className="preview-screen"
            role="group"
            aria-label={label}
            style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
