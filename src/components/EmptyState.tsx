import React from 'react';
import { Ghost } from 'lucide-react';

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
}

export default function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 opacity-60 text-center">
      <div className="mb-4">
        {icon || <Ghost className="w-12 h-12 text-foreground/40 animate-pulse" strokeWidth={1.5} />}
      </div>
      <p className="text-sm font-bold text-foreground/60 max-w-[200px] leading-relaxed">
        {message}
      </p>
    </div>
  );
}
