// TODO: Delete entire file and folder Before merging #380

import React, { useState } from 'react';

import CardContainer from '../CardContainer';
import TabBar, { TabBarItem } from '../TabBar';

export default function CourseInfoSandbox(): React.ReactElement {
  const tabs: TabBarItem[] = [
    { key: '2025-fall', label: '2025 Fall' },
    { key: '2025-spring', label: '2025 Spring' },
    { key: '2024-fall', label: '2024 Fall' },
    { key: '2024-spring', label: '2024 Spring' },
  ];

  // ✅ Track the currently selected tab
  const [selected, setSelected] = useState<TabBarItem>(tabs[0] as TabBarItem);

  return (
    <div style={{ padding: 24 }}>
      <h2>Sandbox: Course Info</h2>

      {/* non-selectable tab bar */}
      <TabBar enableSelect={false} items={tabs} />

      <div style={{ height: 24 }} />

      {/* selectable tab bar */}
      <TabBar
        enableSelect
        items={tabs}
        selected={selected}
        onSelect={(key: string): void => {
          const next = tabs.find((t) => t.key === key);
          if (next) setSelected(next);
        }}
      />

      <div style={{ marginTop: 24 }}>
        <CardContainer color="purple">
          <p>Selected term: {selected.label}</p>
        </CardContainer>
      </div>
    </div>
  );
}
