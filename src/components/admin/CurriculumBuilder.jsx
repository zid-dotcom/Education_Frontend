import React from 'react';
import { Plus, Trash2, Layers, BookOpen } from 'lucide-react';

const CurriculumBuilder = ({ sections, onChange }) => {
  // Update section title
  const handleTitleChange = (index, newTitle) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], title: newTitle };
    onChange(updated);
  };

  // Add a new empty section
  const handleAddSection = () => {
    const newSectionIndex = sections.length + 1;
    const updated = [
      ...sections,
      {
        title: `Week ${newSectionIndex}`,
        topics: ['']
      }
    ];
    onChange(updated);
  };

  // Remove a section
  const handleRemoveSection = (index) => {
    if (sections.length <= 1) {
      alert('A course must have at least one curriculum section.');
      return;
    }
    const updated = sections.filter((_, i) => i !== index);
    onChange(updated);
  };

  // Add a topic to a specific section
  const handleAddTopic = (sectionIndex) => {
    const updated = [...sections];
    const currentTopics = updated[sectionIndex].topics || [];
    updated[sectionIndex] = {
      ...updated[sectionIndex],
      topics: [...currentTopics, '']
    };
    onChange(updated);
  };

  // Update a topic string
  const handleTopicChange = (sectionIndex, topicIndex, newTopic) => {
    const updated = [...sections];
    const currentTopics = [...updated[sectionIndex].topics];
    currentTopics[topicIndex] = newTopic;
    updated[sectionIndex] = {
      ...updated[sectionIndex],
      topics: currentTopics
    };
    onChange(updated);
  };

  // Remove a topic from a section
  const handleRemoveTopic = (sectionIndex, topicIndex) => {
    const updated = [...sections];
    const currentTopics = updated[sectionIndex].topics.filter((_, i) => i !== topicIndex);
    updated[sectionIndex] = {
      ...updated[sectionIndex],
      topics: currentTopics.length > 0 ? currentTopics : ['']
    };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-600" />
          <label className="block text-xs font-extrabold uppercase text-slate-800 tracking-wider">
            Curriculum Builder
          </label>
        </div>
        <span className="text-[11px] font-semibold text-slate-500">
          {sections.length} Section{sections.length > 1 ? 's' : ''} Defined
        </span>
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        {sections.map((section, sIdx) => (
          <div
            key={sIdx}
            className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4 relative"
          >
            {/* Section Header & Title Input */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
              <div className="flex-1 flex items-center gap-2">
                <span className="text-xs font-black text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg shrink-0">
                  Section #{sIdx + 1}
                </span>
                <input
                  type="text"
                  required
                  value={section.title}
                  onChange={(e) => handleTitleChange(sIdx, e.target.value)}
                  placeholder="e.g. Week 1 or Module 1: Introduction"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {sections.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveSection(sIdx)}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-colors self-end sm:self-center shrink-0 flex items-center gap-1 border border-rose-200"
                  title="Delete Section"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Remove Section</span>
                </button>
              )}
            </div>

            {/* Topics List */}
            <div className="space-y-2 pl-1 sm:pl-2">
              <label className="block text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                Topics & Modules
              </label>

              {section.topics.map((topic, tIdx) => (
                <div key={tIdx} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></div>
                  <input
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => handleTopicChange(sIdx, tIdx, e.target.value)}
                    placeholder={`e.g. Topic ${tIdx + 1} details...`}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  
                  {section.topics.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(sIdx, tIdx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                      title="Remove Topic"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {/* Add Topic Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleAddTopic(sIdx)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-50 text-slate-800 hover:text-amber-900 border border-slate-200 text-[11px] font-bold rounded-xl transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-600" />
                  <span>Add Topic</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Section Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleAddSection}
          className="w-full py-3 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-xs font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-700" />
          <span>+ Add Curriculum Section</span>
        </button>
      </div>
    </div>
  );
};

export default CurriculumBuilder;
