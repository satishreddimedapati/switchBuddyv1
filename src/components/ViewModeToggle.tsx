'use client';

import { Laptop, Smartphone, Monitor } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth, ViewMode } from '@/lib/auth';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const modes: { name: ViewMode; label: string; icon: React.ElementType }[] = [
    { name: 'auto', label: 'Auto', icon: Monitor },
    { name: 'desktop', label: 'Desktop', icon: Laptop },
    { name: 'mobile', label: 'Mobile', icon: Smartphone },
]

export function ViewModeToggle() {
  const { viewMode, setViewMode } = useAuth();

  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
       <TooltipProvider>
      {modes.map((mode) => (
        <Tooltip key={mode.name}>
          <TooltipTrigger asChild>
            <Button
              variant={viewMode === mode.name ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode(mode.name)}
            >
              <mode.icon className="h-4 w-4" />
              <span className="sr-only">{mode.label}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{mode.label}</p>
          </TooltipContent>
        </Tooltip>
      ))}
      </TooltipProvider>
    </div>
  );
}
