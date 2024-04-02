import React, { useContext, useMemo } from 'react';
import useLocalStorageState from 'use-local-storage-state';

import { ScheduleContext } from '../../contexts';

type ComparisonContainerShareBack = {
  friendId: string;
  friendName: string;
  friendEmail: string;
  setModalEmail: React.Dispatch<React.SetStateAction<string>>;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function ComparisonContainerShareBack({
  friendName,
  friendEmail,
  friendId,
  setModalEmail,
  setModalOpen,
}: ComparisonContainerShareBack): React.ReactElement | null {
  const [{ allFriends, allVersionNames }] = useContext(ScheduleContext);

  const [hasSeen, setHasSeen] = useLocalStorageState(
    `share-back-invitation-${friendId}`,
    {
      defaultValue: false,
      storageSync: true,
    }
  );

  const schedulesShared = useMemo(() => {
    return Object.keys(allFriends)
      .map((version_id) => {
        if (
          friendId &&
          allFriends[version_id] &&
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          friendId in allFriends[version_id]!
        ) {
          const versionName = allVersionNames.filter(
            (v) => v.id === version_id
          );
          if (versionName.length > 0) {
            return versionName[0]?.name;
          }
        }
        return undefined;
      })
      .filter((v) => v) as string[];
  }, [friendId, allFriends, allVersionNames]);

  if (hasSeen || schedulesShared.length === allVersionNames.length) {
    return null;
  }

  return (
    <div className="shareback-panel">
      <div>
        <p>
          You have <strong>{friendName}&apos;s schedule</strong>. Would you like
          to share yours back?
        </p>
      </div>
      <div>
        <button
          type="button"
          className="dont-shareback-button"
          onClick={(): void => {
            setHasSeen(true);
          }}
        >
          Don&apos;t Share
        </button>

        <button
          type="button"
          className="shareback-button"
          onClick={(): void => {
            setHasSeen(true);
            setModalEmail(friendEmail);
            setModalOpen(true);
          }}
        >
          Share
        </button>
      </div>
    </div>
  );
}
