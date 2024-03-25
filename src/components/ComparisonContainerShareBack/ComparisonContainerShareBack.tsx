import React from 'react';
import useLocalStorageState from 'use-local-storage-state';

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
  const [hasSeen, setHasSeen] = useLocalStorageState(
    `share-back-invitation-${friendId}`,
    {
      defaultValue: false,
      storageSync: true,
    }
  );

  if (hasSeen) {
    return null;
  }

  return (
    <div className="shareback-panel">
      <div>
        <p>
          You have {friendName}&apos;s schedule. Would you like to share yours
          back?
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
