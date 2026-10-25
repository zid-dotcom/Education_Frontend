import { useEffect } from 'react';

/**
 * Hook to manage sidebar & background blur whenever a modal is open in the student portal.
 * Adds/removes the 'student-modal-open' class on document.body.
 * @param {boolean} isOpen
 */
export const useStudentModalBlur = (isOpen) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('student-modal-open');
    } else {
      document.body.classList.remove('student-modal-open');
    }
    return () => {
      document.body.classList.remove('student-modal-open');
    };
  }, [isOpen]);
};

export default useStudentModalBlur;
