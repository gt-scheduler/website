import { IconDefinition, faShareAlt } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';

type ReturnProps = {
  prereqAction: {
    icon: IconDefinition;
    styling: {
      transform: string;
    };
    onClick: () => void;
    tooltip: string;
    id: string;
  };
  prereqControl: (nextPrereqOpen: boolean, nextExpanded: boolean) => void;
  expanded: boolean;
  prereqOpen: boolean;
};

export default function usePrereqControl(
  name: string,
  initExpanded: boolean
): ReturnProps {
  const [prereqOpen, setPrereqOpen] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(initExpanded);

  const prereqControl = (
    nextPrereqOpen: boolean,
    nextExpanded: boolean
  ): void => {
    setPrereqOpen(nextPrereqOpen);
    setExpanded(nextExpanded);
  };
  const prereqAction = {
    icon: faShareAlt,
    styling: { transform: 'rotate(90deg)' },
    onClick: (): void => {
      prereqControl(true, !prereqOpen ? true : !expanded);
    },
    tooltip: 'View Prerequisites',
    id: `${name}-prerequisites`,
  };

  return { prereqAction, prereqControl, expanded, prereqOpen };
}
