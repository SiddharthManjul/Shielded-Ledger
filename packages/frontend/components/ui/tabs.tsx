"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex justify-center items-center bg-card/60 backdrop-blur-sm border border-border/50 p-1 w-fit h-12 text-muted-foreground corner-cut shadow-lg",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-300",
        "text-muted-foreground border border-transparent corner-cut",
        "hover:text-yellow-accent hover:bg-yellow-accent/10 hover:shadow-md hover:shadow-yellow-accent/20",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-accent/50",
        "data-[state=active]:bg-yellow-accent data-[state=active]:text-black data-[state=active]:border-yellow-accent/30",
        "data-[state=active]:shadow-lg data-[state=active]:shadow-yellow-accent/30",
        "data-[state=active]:font-semibold data-[state=active]:glow-button",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "flex-1 outline-none",
        "data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:zoom-in-95",
        "data-[state=active]:duration-200",
        className
      )}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
