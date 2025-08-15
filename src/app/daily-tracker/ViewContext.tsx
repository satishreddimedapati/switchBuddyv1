'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { List, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

type View = 'list' | 'grid';

interface ViewContextType {
  view: View;
  setView: (view: View) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export const ViewProvider = ({ children }: { children: ReactNode }) => {
  const [view, setView] = useState<View>('list');

  return (
    <ViewContext.Provider value={{ view, setView }}>
      {children}
    </ViewContext.Provider>
  );
};

export const useView = () => {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useView must be used within a ViewProvider');
  }
  return context;
};

export function ViewSwitcher() {
  const { view, setView } = useView();

  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted p-1">
      <Button
        variant={view === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setView('list')}
        className={cn("px-3", view === 'list' && 'bg-background shadow-sm')}
      >
        <List className="h-4 w-4" />
        <span className="sr-only">List View</span>
      </Button>
      <Button
        variant={view === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setView('grid')}
        className={cn("px-3", view === 'grid' && 'bg-background shadow-sm')}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="sr-only">Grid View</span>
      </Button>
    </div>
  );
}
