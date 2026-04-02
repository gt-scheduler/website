import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Button from '../Button';
import Modal from '../Modal';
import useImportCourses from '../../hooks/useImportCourses';
import { normalizeCourseName } from '../../utils/misc';

import './stylesheet.scss';

export default function ImportCoursesModal(): React.ReactElement {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [courses, setCourses] = useState<string>('');

  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  const importCourses = useImportCourses();

  useEffect(() => {
    if (!searchParams.get('courses')) {
      setModalOpen(false);
      return;
    }

    const coursesParams = searchParams.get('courses');
    setCourses(coursesParams ?? '');
    setModalOpen(true);
  }, [searchParams]);

  const onHide = (): void => {
    setModalOpen(!modalOpen);
    navigate('/');
  };

  const onConfirm = (): void => {
    importCourses(courses);
    onHide();
  };

  return (
    <Modal
      className="import-courses-modal"
      show={modalOpen}
      onHide={onHide}
      width={700}
      buttonPrompt="Would you like to import these courses?"
      buttons={[
        {
          label: 'No',
          onClick: onHide,
          cancel: true,
        },
        {
          label: 'Yes',
          onClick: onConfirm,
        },
      ]}
    >
      <Button className="remove-close-button" onClick={onHide}>
        <FontAwesomeIcon icon={faXmark} size="xl" />
      </Button>
      <div className="import-courses-modal-content">
        <div className="heading">Import Courses</div>
        <div className="sub-heading">
          You are about to import the following courses into your current
          schedule:
        </div>
        <div className="courses-list">
          {courses
            .split(',')
            .map((course) => normalizeCourseName(course.trim()))
            .filter((course) => course.length > 0)
            .map((course, index) => (
              <div key={index}>{course}</div>
            ))}
        </div>
      </div>
    </Modal>
  );
}
