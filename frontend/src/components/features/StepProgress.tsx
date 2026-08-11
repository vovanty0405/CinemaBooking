import React from 'react';
import { cn } from '../../utils/tailwind';
import { Check } from 'lucide-react';

interface StepProgressProps {
  steps: string[];
  currentStep: number;
}

export const StepProgress: React.FC<StepProgressProps> = ({ steps, currentStep }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative z-0">
        {/* Progress Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-dark-input rounded-full z-0" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-red rounded-full z-0 transition-all duration-500 ease-in-out" 
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={step} className="flex flex-col items-center gap-2 relative z-10">
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300",
                  isCompleted ? "bg-brand-red text-white" : 
                  isCurrent ? "bg-dark-surface border-2 border-brand-red text-brand-red" : 
                  "bg-dark-surface border-2 border-dark-input text-text-muted"
                )}
              >
                {isCompleted ? <Check size={16} strokeWidth={3} /> : index + 1}
              </div>
              <span 
                className={cn(
                  "text-xs md:text-sm font-medium transition-colors duration-300 absolute mt-10 w-24 text-center",
                  (isCompleted || isCurrent) ? "text-text-primary" : "text-text-muted"
                )}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-8" /> {/* Spacer for absolute text */}
    </div>
  );
};
