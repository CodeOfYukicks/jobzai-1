import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Calendar, Clock, MapPin, MessageSquare, User, Check } from 'lucide-react';
import { Interview } from '../../types/job';

interface AddInterviewFormProps {
  onAdd: (interview: Omit<Interview, 'id'>) => Promise<void>;
  onCancel: () => void;
}

export const AddInterviewForm = ({ onAdd, onCancel }: AddInterviewFormProps) => {
  const [formData, setFormData] = useState<Omit<Interview, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    type: 'technical',
    status: 'scheduled',
    location: '',
    notes: '',
    interviewers: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [interviewerInput, setInterviewerInput] = useState('');

  const handleAddInterviewer = () => {
    if (interviewerInput.trim()) {
      setFormData(prev => ({
        ...prev,
        interviewers: [...(prev.interviewers || []), interviewerInput.trim()],
      }));
      setInterviewerInput('');
    }
  };

  const handleRemoveInterviewer = (index: number) => {
    setFormData(prev => ({
      ...prev,
      interviewers: prev.interviewers?.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onAdd(formData);
    } catch (error) {
      console.error('Error adding interview:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mb-4"
    >
      <div className="bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-2xl p-4 sm:p-5 shadow-xl shadow-gray-200/50 dark:shadow-none">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h5 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
              Schedule Interview
            </h5>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Add details about your upcoming interview
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#3d3c3e] transition-colors"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Date
              </label>
              <div className="relative group">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-[#3d3c3e] rounded-xl bg-gray-50 dark:bg-[#242325]/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Time
              </label>
              <div className="relative group">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="time"
                  required
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-[#3d3c3e] rounded-xl bg-gray-50 dark:bg-[#242325]/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* Type and Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Type
              </label>
              <div className="relative">
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Interview['type'] }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#3d3c3e] rounded-xl bg-gray-50 dark:bg-[#242325]/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none"
                >
                  <option value="technical">Technical Interview</option>
                  <option value="hr">HR Screening</option>
                  <option value="manager">Hiring Manager</option>
                  <option value="final">Final Round</option>
                  <option value="other">Other</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Location
              </label>
              <div className="relative group">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Zoom, Office, etc."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-[#3d3c3e] rounded-xl bg-gray-50 dark:bg-[#242325]/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Interviewers */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Interviewers
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={interviewerInput}
                    onChange={(e) => setInterviewerInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterviewer())}
                    placeholder="Add interviewer name"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-[#3d3c3e] rounded-xl bg-gray-50 dark:bg-[#242325]/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none placeholder:text-gray-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddInterviewer}
                  className="px-3 py-2 bg-gray-900 dark:bg-[#3d3c3e] text-white rounded-xl hover:bg-gray-800 dark:hover:bg-[#4a494b] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {formData.interviewers && formData.interviewers.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {formData.interviewers.map((interviewer, idx) => (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-full text-xs text-blue-700 dark:text-blue-300"
                    >
                      <span>{interviewer}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveInterviewer(idx)}
                        className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </motion.span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Notes
            </label>
            <div className="relative group">
              <MessageSquare className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any preparation notes..."
                rows={2}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-[#3d3c3e] rounded-xl bg-gray-50 dark:bg-[#242325]/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-[#3d3c3e]">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] hover:bg-gray-50 dark:hover:bg-[#3d3c3e] rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-[2] px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-xl transition-all shadow-lg shadow-gray-900/20 dark:shadow-none disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white dark:border-gray-900/30 dark:border-t-gray-900 rounded-full animate-spin" />
                  <span>Scheduling...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Schedule Interview</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};
