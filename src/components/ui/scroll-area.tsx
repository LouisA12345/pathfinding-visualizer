"use client"

import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area"

import { cn } from "@/lib/utils"

function ScrollArea({
  className,
  children,
  ...props
}: ScrollAreaPrimitive.Root.Props) {
  return (
    // min-w-0/min-h-0: a scroll container's job is to be constrained by its
    // parent and let its own content scroll, never to size itself off its
    // content — but flex/grid items default to `min-width/height: auto`,
    // which lets a wide/tall descendant (anywhere within, however deep)
    // inflate this element past whatever space its parent actually gave
    // it. That inflated box then gets clipped by the nearest ancestor
    // with real overflow control, silently cutting off whatever landed
    // past the edge — which is exactly what was happening inside
    // MobileMenu's dialogs, since DialogContent is a grid container.
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative min-h-0 min-w-0", className)}
      {...props}
    >
      {/* base-ui sets `style={{ overflow: 'scroll' }}` inline on this exact
          element (both axes) to build its custom scrollbar, which beats a
          plain `overflow-x-hidden` class — this app never renders a
          horizontal ScrollBar or wants horizontal scroll inside one, so
          `!overflow-x-hidden` (Tailwind's important modifier, the one
          thing that does override an inline style) suppresses it. */}
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="size-full !overflow-x-hidden rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border"
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

export { ScrollArea, ScrollBar }
