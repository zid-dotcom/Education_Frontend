import { useEffect } from 'react';

/**
 * Hook to manage sidebar blur whenever a modal is open in the staff portal.
 * Adds/removes the 'staff-modal-open' class on document.body.
 * @param {boolean} isOpen
 */
export const useStaffModalBlur = (isOpen) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('staff-modal-open');
    } else {
      document.body.classList.remove('staff-modal-open');
    }
    return () => {
      document.body.classList.remove('staff-modal-open');
    };
  }, [isOpen]);
};

export default useStaffModalBlur;
