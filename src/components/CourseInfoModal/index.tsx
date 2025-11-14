import React from 'react';

import Modal from '../Modal';
import CourseInfo from '../CourseInfo';

export type CourseInfoModalProps = {
  courseId: string;
  show: boolean;
  onHide: () => void;
};

export default function CourseInfoModal({
  courseId,
  show,
  onHide,
}: CourseInfoModalProps): React.ReactElement {
  return (
    <Modal show={show} onHide={onHide} className="course-info-modal">
      <CourseInfo courseId={courseId} infoType="long" />
    </Modal>
  );
}
