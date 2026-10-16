import React from 'react';
import CourseCard from './CourseCard';
import { SearchX, BookOpen } from 'lucide-react';
import Button from '../common/Button';

const CourseGrid = ({ courses = [], onApply, onResetFilters }) => {
  if (courses.length === 0) {
    return (
      <div className="py-16 px-6 text-center bg-white rounded-3xl border border-dashed border-slate-300 max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <SearchX className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">No Courses Found</h3>
        <p className="mt-2 text-sm text-slate-600">
          We couldn't find any courses matching your current search query or filter selection.
        </p>
        {onResetFilters && (
          <Button
            onClick={onResetFilters}
            variant="primary"
            size="md"
            className="mt-6"
          >
            Clear Search & Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {courses.map((course, index) => (
        <div key={course.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 90}ms` }}>
          <CourseCard course={course} onApply={onApply} />
        </div>
      ))}
    </div>
  );
};

export default CourseGrid;
