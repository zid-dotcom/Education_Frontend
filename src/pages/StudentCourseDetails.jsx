import React, { useState } from 'react';
import CourseDetails from './CourseDetails';
import ApplicationModal from '../components/common/ApplicationModal';

const StudentCourseDetails = () => {
  const [selectedCourse, setSelectedCourse] = useState(null);

  return (
    <>
      <CourseDetails
        studentView
        onOpenApplyModal={(course) => setSelectedCourse(course)}
      />
      <ApplicationModal
        isOpen={Boolean(selectedCourse)}
        onClose={() => setSelectedCourse(null)}
        defaultCourse={selectedCourse}
      />
    </>
  );
};

export default StudentCourseDetails;
