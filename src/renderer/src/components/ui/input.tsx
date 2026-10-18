import * as React from 'react'
import { cn } from '@renderer/lib/utils'

const fieldClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }: InputProps, ref) => (
    <input ref={ref} className={cn(fieldClass, 'h-9', className)} {...props} />
  )
)
Input.displayName = 'Input'

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }: TextareaProps, ref) => (
    <textarea ref={ref} className={cn(fieldClass, 'min-h-24 resize-y', className)} {...props} />
  )
)
Textarea.displayName = 'Textarea'
