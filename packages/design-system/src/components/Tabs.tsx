'use client';

import { useState, type ReactNode } from 'react';

export interface Tab {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
  onChange?: (id: string) => void;
}

export function Tabs({ tabs, defaultTab, className = '', onChange }: TabsProps) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id);
  const activeTab = tabs.find((t) => t.id === active);

  return (
    <div className={`ds-tabs ${className}`}>
      <div className="ds-tabs__list" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              disabled={tab.disabled}
              className={`ds-tabs__tab ${isActive ? 'ds-tabs__tab--active' : ''} ${tab.disabled ? 'ds-tabs__tab--disabled' : ''}`}
              onClick={() => {
                setActive(tab.id);
                onChange?.(tab.id);
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {activeTab && (
        <div
          role="tabpanel"
          id={`panel-${activeTab.id}`}
          aria-labelledby={`tab-${activeTab.id}`}
          className="ds-tabs__panel"
        >
          {activeTab.content}
        </div>
      )}
    </div>
  );
}
