import React from 'react';
import { Search, Filter, X } from 'lucide-react';

const SearchBar = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories = []
}) => {
  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl shadow-amber-900/5 border border-amber-200/60 max-w-5xl mx-auto mb-10">
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-amber-500">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses (e.g., Web Development, Fashion Design, Hotel Management)..."
            className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-full text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Categories:
        </span>
        
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-amber-200 text-slate-950 shadow-sm border border-amber-300 font-bold'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          All Courses
        </button>

        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-amber-200 text-slate-950 shadow-sm border border-amber-300 font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SearchBar;
