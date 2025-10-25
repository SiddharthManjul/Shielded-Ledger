import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import React from "react";

interface GamingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  variant?: "default" | "feature" | "stats" | "action";
  glowColor?: "yellow" | "blue" | "green" | "purple";
}

export function GamingCard({
  title,
  description,
  icon,
  children,
  variant = "default",
  glowColor = "yellow",
  className,
  ...props
}: GamingCardProps) {
  const glowColors = {
    yellow: "hover:border-yellow-accent/50 hover:shadow-yellow-accent/20",
    blue: "hover:border-blue-500/50 hover:shadow-blue-500/20",
    green: "hover:border-green-500/50 hover:shadow-green-500/20",
    purple: "hover:border-purple-500/50 hover:shadow-purple-500/20",
  };

  const cardVariants = {
    default: "card-glow",
    feature:
      "card-glow transform hover:scale-105 cursor-pointer transition-all duration-300",
    stats:
      "card-glow border-yellow-accent/30 bg-gradient-to-br from-yellow-accent/5 to-golden/5",
    action:
      "card-glow border-yellow-accent/50 bg-gradient-to-br from-yellow-accent/10 to-transparent",
  };

  return (
    <Card
      className={cn(
        cardVariants[variant],
        glowColors[glowColor],
        "overflow-hidden relative",
        className
      )}
      {...props}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />

      {/* Content */}
      <div className="z-10 relative">
        {(title || description || icon) && (
          <CardHeader className="space-y-3">
            {icon && (
              <div className="flex justify-center items-center bg-gradient-to-br from-yellow-accent/20 to-golden/20 border border-yellow-accent/30 w-12 h-12">
                {icon}
              </div>
            )}
            {title && (
              <CardTitle className="font-bold text-white text-xl">
                {title}
              </CardTitle>
            )}
            {description && (
              <CardDescription className="text-muted-foreground">
                {description}
              </CardDescription>
            )}
          </CardHeader>
        )}

        {children && (
          <CardContent
            className={cn(!title && !description && !icon && "pt-6")}
          >
            {children}
          </CardContent>
        )}
      </div>

      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-accent/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </Card>
  );
}

interface CountdownBoxProps {
  timeLeft: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
  label?: string;
}

export function CountdownBox({
  timeLeft,
  label = "Sale ends in:",
}: CountdownBoxProps) {
  return (
    <div className="text-center countdown-box">
      {label && (
        <p className="mb-3 font-medium text-yellow-accent text-sm">{label}</p>
      )}
      <div className="flex justify-center items-center space-x-4">
        {Object.entries(timeLeft).map(([unit, value], index) => (
          <React.Fragment key={unit}>
            <div className="text-center">
              <div className="font-numbers font-bold text-white text-2xl md:text-3xl">
                {value.toString().padStart(2, "0")}
              </div>
              <div className="text-muted-foreground text-xs capitalize">
                {unit}
              </div>
            </div>
            {index < Object.entries(timeLeft).length - 1 && (
              <div className="font-bold text-yellow-accent text-xl">:</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
}

export function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
}: StatsCardProps) {
  const changeColors = {
    positive: "text-green-400",
    negative: "text-red-400",
    neutral: "text-muted-foreground",
  };

  return (
    <GamingCard variant="stats" className="text-center">
      <div className="space-y-3">
        {icon && (
          <div className="flex justify-center">
            <div className="bg-yellow-accent/20 p-3 text-yellow-accent">
              {icon}
            </div>
          </div>
        )}
        <div>
          <div className="font-numbers font-bold text-white text-2xl">
            {value}
          </div>
          <div className="text-muted-foreground text-sm">{title}</div>
          {change && (
            <div
              className={cn(
                "mt-1 font-numbers text-xs",
                changeColors[changeType]
              )}
            >
              {change}
            </div>
          )}
        </div>
      </div>
    </GamingCard>
  );
}
