import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@renderer/lib/utils'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

/** Casilla sin relleno: solo contorno, y una marca cuando está activada. */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }: CheckboxProps, ref) => (
    <span className={cn('relative mt-1 inline-flex size-4 shrink-0', className)}>
      <input
        ref={ref}
        type="checkbox"
        className="peer size-4 appearance-none rounded-[4px] border-[1.5px] border-foreground/70 bg-transparent transition-colors hover:border-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-60 motion-reduce:transition-none"
        {...props}
      />
      <Check
        strokeWidth={3.5}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-4 scale-0 text-foreground transition-transform duration-200 peer-checked:scale-100 motion-reduce:transition-none"
      />
    </span>
  )
)
Checkbox.displayName = 'Checkbox'
