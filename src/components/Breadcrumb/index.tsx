import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

import { classes } from '../../utils/misc';

import './stylesheet.scss';

export type BreadcrumbItem = {
  label: string;
  link?: string;
};

export type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export default function Breadcrumb({
  items,
}: BreadcrumbProps): React.ReactElement {
  return (
    <nav className={classes('Breadcrumb')}>
      <ul className="list">
        {items.map((item, index) => (
          <li key={index} className="item">
            {item.link ? (
              <a href={item.link} className="link">
                {item.label}
              </a>
            ) : (
              <span className="label">{item.label}</span>
            )}
            {index < items.length - 1 && (
              <FontAwesomeIcon icon={faChevronRight} className="separator" />
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
