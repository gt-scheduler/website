import React, {
  ChangeEvent,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

import { CourseFilter } from '..';
import { ScheduleContext } from '../../contexts';
import Modal from '../Modal';
import { CAMPUSES, DELIVERY_MODES, CREDIT } from '../../constants';

import 'react-virtualized/styles.css';
import './stylesheet.scss';

export default function SearchContainer(): React.ReactElement {
  const [, { patchSchedule }] = useContext(ScheduleContext);

  const [confirmReset, setConfirmReset] = useState(false);

  const [keyword, setKeyword] = useState('');

  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChangeKeyword = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      let input = e.target.value.trim();
      const results = /^([a-z]+)(\d.*)$/i.exec(input);
      if (results != null) {
        const [, subject, number] = results as unknown as [
          string,
          string,
          string
        ];
        input = `${subject} ${number}`;
      }
      setKeyword(input);
    },
    []
  );
  type SortKey = 'deliveryMode' | 'campus' | 'creditHours';

  type SortFilter = {
    [sortKey in SortKey]: string[];
  };

  const [filter, setFilter] = useState<SortFilter>({
    deliveryMode: [],
    campus: [],
    creditHours: [],
  });

  const handleResetFilter = useCallback(
    (key) => {
      setFilter({
        ...filter,
        [key]: [],
      });
    },
    [filter]
  );
  const handleToggleFilter = useCallback(
    (key: SortKey, tag: string) => {
      const tags = filter[key];
      setFilter({
        ...filter,
        [key]: tags.includes(tag)
          ? tags.filter((v) => v !== tag)
          : [...tags, tag],
      });
    },
    [filter]
  );

  return (
    <>
      <div className="CourseAdd">
        <div className="add">
          <div className="primary">
            <FontAwesomeIcon className="icon" fixedWidth icon={faSearch} />
            <div className="keyword-wrapper">
              <input
                type="text"
                placeholder="Subject or course number"
                ref={inputRef}
                value={keyword}
                onChange={handleChangeKeyword}
                className="keyword"
              />
            </div>
          </div>

          {[
            ['Credit Hours & Class Times', 'creditHours', CREDIT] as const,
            ['Delivery Mode', 'deliveryMode', DELIVERY_MODES] as const,
            ['Campus', 'campus', CAMPUSES] as const,
          ].map(([name, property, labels]) => (
            <CourseFilter
              key={property}
              name={name}
              labels={labels}
              selectedTags={filter[property]}
              onReset={(): void => handleResetFilter(property)}
              onToggle={(tag): void => handleToggleFilter(property, tag)}
            />
          ))}
        </div>
      </div>

      <Modal
        show={confirmReset}
        onHide={(): void => setConfirmReset(false)}
        buttons={[
          {
            label: 'Cancel',
            cancel: true,
            onClick: (): void => setConfirmReset(false),
          },
          {
            label: 'Reset',
            onClick: (): void => {
              setConfirmReset(false);
              patchSchedule({
                pinnedCrns: [],
              });
            },
          },
        ]}
      >
        <div style={{ textAlign: 'center' }}>
          <h2>Reset confirmation</h2>
          <p>Are you sure you want to reset selected sections?</p>
        </div>
      </Modal>
    </>
  );
}
