import { useState, useEffect } from 'react';
import { Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InlineFormCard from './InlineFormCard';
import InlineInput from './InlineInput';
import ToggleSwitch from './ToggleSwitch';
import { CVCertification } from '../../../types/cvEditor';
import { generateId } from '../../../lib/cvEditorUtils';

interface CertificationInlineFormProps {
  initialData?: CVCertification;
  onSave: (certification: CVCertification) => void;
  onCancel: () => void;
}

export default function CertificationInlineForm({
  initialData,
  onSave,
  onCancel
}: CertificationInlineFormProps) {
  const [formData, setFormData] = useState<CVCertification>({
    id: generateId(),
    name: '',
    issuer: '',
    date: '',
    expiryDate: '',
    credentialId: '',
    url: ''
  });

  const [noExpiry, setNoExpiry] = useState(false);
  const [yearOnly, setYearOnly] = useState(false);
  const [showDateSettings, setShowDateSettings] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setNoExpiry(!initialData.expiryDate);
    }
  }, [initialData]);

  const handleSave = () => {
    onSave({
      ...formData,
      expiryDate: noExpiry ? '' : formData.expiryDate
    });
  };

  return (
    <InlineFormCard
      onCancel={onCancel}
      onSave={handleSave}
      isEditing={!!initialData}
    >
      {/* Name & Issuer */}
      <div className="grid grid-cols-2 gap-2">
        <InlineInput
          label="Certification Name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="ex: AWS Solutions Architect"
          autoFocus
        />
        <InlineInput
          label="Issuing Organization"
          value={formData.issuer}
          onChange={(e) => setFormData(prev => ({ ...prev, issuer: e.target.value }))}
          placeholder="ex: Amazon Web Services"
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Issue Date
          </label>
          <input
            type={yearOnly ? 'number' : 'month'}
            value={yearOnly ? formData.date?.split('-')[0] || '' : formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            placeholder="+ issue date"
            min={yearOnly ? 1990 : undefined}
            max={yearOnly ? 2030 : undefined}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Expiry Date
          </label>
          <input
            type={yearOnly ? 'number' : 'month'}
            value={noExpiry ? '' : (yearOnly ? formData.expiryDate?.split('-')[0] || '' : formData.expiryDate || '')}
            onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
            placeholder="+ expiry"
            min={yearOnly ? 1990 : undefined}
            max={yearOnly ? 2040 : undefined}
            disabled={noExpiry}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Date Options - Compact */}
      <div className="p-2.5 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/30">
        <div className="flex flex-wrap items-center gap-4">
          <ToggleSwitch
            label="No expiry"
            checked={noExpiry}
            onChange={(checked) => {
              setNoExpiry(checked);
              if (checked) setFormData(prev => ({ ...prev, expiryDate: '' }));
            }}
          />
          <ToggleSwitch
            label="Year only"
            checked={yearOnly}
            onChange={setYearOnly}
          />
        </div>
        
        <button
          type="button"
          onClick={() => setShowDateSettings(!showDateSettings)}
          className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
        >
          <Settings2 className="w-3 h-3" />
          Change Date Format
        </button>

        <AnimatePresence>
          {showDateSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-1.5">
                {['2024', 'Jan 2024', 'January 2024', '01/2024'].map((format) => (
                  <button
                    key={format}
                    type="button"
                    className="px-2 py-1 text-[10px] font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                  >
                    {format}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Credential Info */}
      <div className="grid grid-cols-2 gap-2">
        <InlineInput
          label="Credential ID"
          value={formData.credentialId || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, credentialId: e.target.value }))}
          placeholder="ex: ABC123XYZ"
        />
        <InlineInput
          label="Credential URL"
          value={formData.url || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
          placeholder="https://..."
        />
      </div>
    </InlineFormCard>
  );
}
