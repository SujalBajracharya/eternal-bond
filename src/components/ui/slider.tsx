"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

interface RangeSliderProps extends React.ComponentPropsWithoutRef<
  typeof SliderPrimitive.Root
> {
  label?: string;
  showValues?: boolean;
}

export function Slider({
  className,
  label,
  showValues = true,
  value,
  defaultValue = [22, 35],
  min = 18,
  max = 60,
  step = 1,
  ...props
}: RangeSliderProps) {
  const values = (value as number[]) || defaultValue;

  return (
    <div className="w-full space-y-4">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">{label}</label>

          <span className="text-sm text-muted-foreground">
            {values[0]} - {values[1]}
          </span>
        </div>
      )}

      <div className="relative py-8">
        <SliderPrimitive.Root
          value={values}
          min={min}
          max={max}
          step={step}
          className={cn(
            "relative flex w-full touch-none select-none items-center",
            className,
          )}
          {...props}
        >
          <SliderPrimitive.Track
            className="
              relative
              h-3
              w-full
              grow
              overflow-hidden
              rounded-full
              border
              border-white/10
              bg-white/[0.04]
              backdrop-blur-sm
            "
          >
            <div
              className="
                absolute inset-0 opacity-40
                bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.2)_1px,transparent_1px)]
                bg-[length:18px_18px]
              "
            />

            <SliderPrimitive.Range
              className="
                absolute
                h-full
                bg-gradient-to-r
                from-primary
                via-primary
                to-accent
                shadow-[0_0_12px_hsl(var(--primary))]
              "
            />
          </SliderPrimitive.Track>

          {values.map((v, index) => (
            <SliderPrimitive.Thumb
              key={index}
              className="
                relative block h-7 w-7 rounded-full border border-white/20 bg-background
                shadow-lg
                transition-all
                duration-200
                hover:scale-110
                hover:shadow-xl
                active:scale-125
                focus-visible:outline-none
                focus-visible:ring-4
                focus-visible:ring-violet-500/20
              "
            >
              <div className="absolute inset-1 rounded-full bg-primary" />

              <div className="absolute inset-0 rounded-full blur-md -z-10" />

              {showValues && (
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 rounded-xl border border-white/10 bg-card/90 px-3 py-1 text-xs font-semibold shadow-xl backdrop-blur-md whitespace-nowrap">
                  {v}
                </div>
              )}
            </SliderPrimitive.Thumb>
          ))}
        </SliderPrimitive.Root>

        <div className="mt-4 flex justify-between text-xs text-muted-foreground">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
}
