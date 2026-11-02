"use client";

import React, { ElementType } from "react";

export type AdminContainerVariant = "default" | "full" | "wide" | "narrow" | "fluid";

export interface AdminContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: AdminContainerVariant;
  className?: string;
  as?: ElementType;
}

const variantStyles: Record<AdminContainerVariant, string> = {
  default: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8",
  wide: "max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8",
  narrow: "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8",
  full: "w-full px-4 sm:px-6 lg:px-8 py-6",
  fluid: "w-full p-0",
};

/**
 * Standard reusable inner container for Super Admin console pages.
 * Supports fluid fullwidth canvases, ultra-wide monitoring dashboards, or standard contained widths.
 * Automatically adapts between dark and light themes.
 */
export function AdminContainer({
  children,
  variant = "default",
  className = "",
  as: Component = "div",
  ...props
}: AdminContainerProps) {
  return (
    <Component
      className={`w-full transition-all duration-150 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
