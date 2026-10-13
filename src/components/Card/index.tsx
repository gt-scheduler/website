import React from 'react';

import './stylesheet.scss';

type CardContainerProps = {
  color: string;
  children?: React.ReactNode;
  className?: string;
};

export default function CardContainer({
  color,
  children,
  className,
}: CardContainerProps): React.ReactElement {
  return (
    <div
      className={`CardContainer ${className || ''}`}
      style={{ borderLeftColor: color }}
    >
      {children}
    </div>
  );
}
