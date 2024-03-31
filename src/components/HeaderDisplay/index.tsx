import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faPencilAlt,
  faTrashAlt,
  faCopy,
} from '@fortawesome/free-solid-svg-icons';

import { getSemesterName } from '../../utils/semesters';
import { Button, Select, Tab } from '..';
import { LoadingSelect, SelectAction } from '../Select';
import Spinner from '../Spinner';
import { getNextVersionName } from '../../utils/misc';
import { DESKTOP_BREAKPOINT, LARGE_MOBILE_BREAKPOINT } from '../../constants';
import useScreenWidth from '../../hooks/useScreenWidth';
import HeaderActionBar from '../HeaderActionBar';
import Modal from '../Modal';
import { AccountContextValue } from '../../contexts/account';
import { Term } from '../../types';
import Toast, { notifyToast } from '../Toast';

import './stylesheet.scss';

type VersionState =
  | { type: 'loading' }
  | {
      type: 'loaded';
      currentVersion: string;
      allVersionNames: readonly { id: string; name: string }[];
      setCurrentVersion: (next: string) => void;
      addNewVersion: (name: string, select?: boolean) => string;
      deleteVersion: (id: string) => void;
      renameVersion: (id: string, newName: string) => void;
      cloneVersion: (id: string, newName: string) => void;
    };

type TermsState =
  | { type: 'loading' }
  | {
      type: 'loaded';
      terms: Term[];
      currentTerm: string;
      onChangeTerm: (next: string) => void;
    };

export type HeaderDisplayProps = {
  totalCredits?: number | null;
  currentTab: number;
  onChangeTab: (newTab: number) => void;
  onToggleMenu: () => void;
  tabs: string[];
  onCopyCrns?: () => void;
  enableCopyCrns?: boolean;
  onExportCalendar?: () => void;
  enableExportCalendar?: boolean;
  onDownloadCalendar?: () => void;
  enableDownloadCalendar?: boolean;
  termsState: TermsState;
  versionsState: VersionState;
  accountState: AccountContextValue | { type: 'loading' };
  skeleton: boolean;
};

/**
 * Renders the top header component as a simple display component,
 * letting any substantive state be passed in as props.
 * See `<Header>` for the full implementation that owns the header state.
 * This is safe to render without `ScheduleContext` or `TermsContext`
 * being present.
 */
export default function HeaderDisplay({
  totalCredits = null,
  currentTab,
  onChangeTab,
  onToggleMenu,
  tabs,
  onCopyCrns = (): void => undefined,
  enableCopyCrns = false,
  onExportCalendar = (): void => undefined,
  enableExportCalendar = false,
  onDownloadCalendar = (): void => undefined,
  enableDownloadCalendar = false,
  termsState,
  versionsState,
  accountState,
  skeleton = true,
}: HeaderDisplayProps): React.ReactElement {
  // Re-render when the page is re-sized to become mobile/desktop
  // (desktop is >= 1024 px wide)
  const mobile = !useScreenWidth(DESKTOP_BREAKPOINT);

  // Re-render when the page is re-sized to be small mobile vs. greater
  // (small mobile is < 600 px wide)
  const largeMobile = useScreenWidth(LARGE_MOBILE_BREAKPOINT);

  useEffect(() => {
    if (termsState.type === 'loaded' && !skeleton) {
      const termObject = termsState.terms.filter(
        (term) => term.term === termsState.currentTerm
      )[0];

      if (!termObject?.finalized) {
        notifyToast('finalized-term-toast');
      }
    }
  }, [termsState, skeleton]);

  return (
    <div className="Header">
      {!skeleton ? (
        <Toast
          id="finalized-term-toast"
          color="orange"
          message={`Note: The schedule for ${
            termsState.type === 'loaded'
              ? getSemesterName(termsState.currentTerm)
              : 'Loading'
          } may not be fully finalized.`}
          selfDisappearing={false}
        />
      ) : null}
      {/* Menu button, only displayed on mobile */}
      {mobile && (
        <Button className="nav-menu-button" onClick={onToggleMenu}>
          <FontAwesomeIcon className="icon" fixedWidth icon={faBars} />
        </Button>
      )}

      {/* Left-aligned logo */}
      <div className="logo">
        <span className="gt">GT </span>
        <span className="scheduler">Scheduler</span>
      </div>

      {/* Term selector */}
      {termsState.type === 'loaded' ? (
        <Select
          onChange={termsState.onChangeTerm}
          current={termsState.currentTerm}
          options={termsState.terms.map((currentTerm) => ({
            id: currentTerm.term,
            label: getSemesterName(currentTerm.term),
          }))}
          className="semester"
        />
      ) : (
        <LoadingSelect />
      )}
      {/* Version selector */}
      <VersionSelector state={versionsState} />

      <span className="credits">
        {totalCredits === null ? (
          <Spinner size="small" style={{ marginRight: 8 }} />
        ) : (
          totalCredits
        )}{' '}
        Credits
      </span>

      {/* Include middle-aligned tabs on desktop */}
      {!mobile && (
        <div className="tabs">
          {tabs.map((tabLabel, tabIdx) => (
            <Tab
              key={tabIdx}
              active={tabIdx === currentTab}
              onClick={(): void => onChangeTab(tabIdx)}
              label={tabLabel}
            />
          ))}
        </div>
      )}

      {/* Include action bar on large mobile and higher */}
      {largeMobile && (
        <HeaderActionBar
          accountState={accountState}
          onCopyCrns={onCopyCrns}
          enableCopyCrns={enableCopyCrns}
          onExportCalendar={onExportCalendar}
          enableExportCalendar={enableExportCalendar}
          onDownloadCalendar={onDownloadCalendar}
          enableDownloadCalendar={enableDownloadCalendar}
        />
      )}
    </div>
  );
}

// Private sub-components

type VersionSelectorProps = {
  state: VersionState;
};

/**
 * Allows users to:
 * - switch between existing schedule versions
 * - add new blank versions with default (Primary, Secondary, etc.) names
 * - delete and rename existing versions.
 */
function VersionSelector({ state }: VersionSelectorProps): React.ReactElement {
  // Manage the delete confirmation state,
  // used to show a modal when it is non-null.
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showModal, setShowModal] = useState(false);

  if (state.type === 'loading') {
    return <LoadingSelect />;
  }

  return (
    <>
      <Select
        className="version-switch"
        desiredItemWidth={260}
        newLabel="New Schedule"
        onChange={state.setCurrentVersion}
        current={state.currentVersion}
        options={state.allVersionNames.map((version) => {
          const actions: SelectAction<string>[] = [];

          // Add the edit (rename) action
          actions.push({
            type: 'edit',
            icon: faPencilAlt,
            onCommit: (newName: string) => {
              state.renameVersion(version.id, newName);
              return true;
            },
            id: `${version.id}-edit`,
            tooltip: 'Rename Schedule',
          });

          // Add the duplicate button
          actions.push({
            type: 'button',
            icon: faCopy,
            onClick: () => {
              state.cloneVersion(version.id, `Copy of ${version.name}`);
            },
            id: `${version.id}-copy`,
            tooltip: 'Create a Copy',
          });

          // Add the delete action
          if (state.allVersionNames.length >= 2) {
            actions.push({
              type: 'button',
              icon: faTrashAlt,
              onClick: () => {
                // Display a confirmation dialog before deleting the version
                setDeleteConfirm(version);
                setShowModal(true);
              },
              id: `${version.id}-delete`,
              tooltip: 'Delete Schedule',
            });
          }

          return {
            id: version.id,
            label: version.name,
            actions,
          };
        })}
        onClickNew={(): void => {
          // Handle creating a new version with the auto-generated name
          // (like 'Primary' or 'Secondary')
          state.addNewVersion(
            getNextVersionName(state.allVersionNames.map(({ name }) => name)),
            true
          );
        }}
        id="version-selector-dropdown"
      />

      <Modal
        show={showModal}
        onHide={(): void => setDeleteConfirm(null)}
        buttons={[
          {
            label: 'Cancel',
            cancel: true,
            onClick: (): void => setShowModal(false),
          },
          {
            label: 'Delete',
            onClick: (): void => {
              if (deleteConfirm != null) {
                state.deleteVersion(deleteConfirm.id);
              }
              setShowModal(false);
            },
          },
        ]}
        // Use this because we use the same state as the show prop
        // to determine the contents of the children.
        // This prevents the children from flashing
        // a different value when the modal is disappearing.
        preserveChildrenWhileHiding
      >
        <div style={{ textAlign: 'center' }}>
          <h2>Delete confirmation</h2>
          <p>
            Are you sure you want to delete schedule &ldquo;
            {deleteConfirm?.name ?? '<unknown>'}&rdquo;?
          </p>
        </div>
      </Modal>
    </>
  );
}
