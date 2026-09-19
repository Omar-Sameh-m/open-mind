import React from 'react';
import { Classification } from '../types';
import { CheckCircle2, AlertTriangle, AlertCircle, HelpCircle, HelpCircle as HelpIcon } from 'lucide-react';

interface ClassificationBadgeProps {
  classification: Classification;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'stamp';
}

export const CLASSIFICATION_CONFIG: Record<
  Classification,
  {
    label: string;
    description: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    stampBorder: string;
    stampText: string;
    stampBg: string;
    stampRotate: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  solid_understanding: {
    label: 'Solid Understanding',
    description: 'Correct answer & logically sound reasoning',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-200',
    stampBorder: 'border-emerald-600',
    stampText: 'text-emerald-700',
    stampBg: 'bg-emerald-50/90',
    stampRotate: '-rotate-2',
    icon: CheckCircle2,
  },
  careless_slip: {
    label: 'Careless Slip',
    description: 'Understands the concept, minor mechanical/arithmetic error',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
    stampBorder: 'border-amber-600',
    stampText: 'text-amber-700',
    stampBg: 'bg-amber-50/90',
    stampRotate: 'rotate-1',
    icon: AlertTriangle,
  },
  misconception: {
    label: 'Misconception',
    description: 'Fundamental gap or incorrect rule application',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-800',
    borderClass: 'border-orange-200',
    stampBorder: 'border-orange-600',
    stampText: 'text-orange-700',
    stampBg: 'bg-orange-50/90',
    stampRotate: '-rotate-3',
    icon: AlertCircle,
  },
  lucky_guess: {
    label: 'Lucky Guess',
    description: 'Correct final answer, but flawed or guessing reasoning',
    bgClass: 'bg-rose-50',
    textClass: 'text-rose-800',
    borderClass: 'border-rose-200',
    stampBorder: 'border-rose-600',
    stampText: 'text-rose-700',
    stampBg: 'bg-rose-50/90',
    stampRotate: 'rotate-2',
    icon: HelpCircle,
  },
  unclear: {
    label: 'Unclear Reasoning',
    description: 'Recording was too brief or inaudible to determine conceptual approach',
    bgClass: 'bg-sky-50',
    textClass: 'text-sky-800',
    borderClass: 'border-sky-200',
    stampBorder: 'border-sky-600',
    stampText: 'text-sky-700',
    stampBg: 'bg-sky-50/90',
    stampRotate: '-rotate-1',
    icon: HelpIcon,
  },
};

export const ClassificationBadge: React.FC<ClassificationBadgeProps> = ({
  classification,
  showIcon = true,
  size = 'md',
  variant = 'badge',
}) => {
  const config = CLASSIFICATION_CONFIG[classification] || CLASSIFICATION_CONFIG.solid_understanding;
  const IconComponent = config.icon;

  if (variant === 'stamp') {
    return (
      <span
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-dashed ${config.stampBorder} ${config.stampBg} ${config.stampText} ${config.stampRotate} font-mono uppercase font-bold tracking-wider text-xs sm:text-sm shadow-xs transition-transform transform select-none`}
        style={{
          boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
        }}
      >
        {showIcon && <IconComponent className="w-4 h-4 shrink-0 stroke-[2.5]" />}
        <span>{config.label}</span>
      </span>
    );
  }

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3 py-1.5 gap-2',
    lg: 'text-base px-4 py-2 gap-2.5 font-medium',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${config.bgClass} ${config.textClass} ${config.borderClass} ${sizeClasses[size]} tracking-tight`}
    >
      {showIcon && <IconComponent className={iconSizes[size]} />}
      <span>{config.label}</span>
    </span>
  );
};
