import { useState, useEffect } from 'react';
import PremiumModal from '../shared/PremiumModal';
import PremiumInput from '../shared/PremiumInput';
import { CVCertification } from '../../../types/cvEditor';
import { generateId } from '../../../lib/cvEditorUtils';

interface CertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (certification: CVCertification) => void;
  initialData?: CVCertification;
}

export default function CertificationModal({
  isOpen,
  onClose,
  onSave,
  initialData
}: CertificationModalProps) {
  const [formData, setFormData] = useState<CVCertification>({
    id: generateId(),
    name: '',
    issuer: '',
    date: '',
    expiryDate: '',
    credentialId: '',
    url: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        id: generateId(),
        name: '',
        issuer: '',
        date: '',
        expiryDate: '',
        credentialId: '',
        url: ''
      });
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <button
        onClick={onClose}
        className="px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
      >
        Cancel
      </button>
      <button
        onClick={handleSave}
        className="group relative px-7 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-full shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        <span className="relative z-10">Save Certification</span>
      </button>
    </div>
  );

  return (
    <PremiumModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Certification' : 'Add Certification'}
      footer={footer}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Certification Name */}
        <PremiumInput
          label="Certification Name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          autoFocus
        />

        {/* Issuer */}
        <PremiumInput
          label="Issuing Organization"
          value={formData.issuer}
          onChange={(e) => setFormData(prev => ({ ...prev, issuer: e.target.value }))}
        />

        {/* Dates */}
        <div className="grid grid-cols-2 gap-6">
          <PremiumInput
            label="Issue Date"
            type="month"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
          />
          <PremiumInput
            label="Expiry Date (Optional)"
            type="month"
            value={formData.expiryDate || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
          />
        </div>

        {/* Credential ID */}
        <PremiumInput
          label="Credential ID (Optional)"
          value={formData.credentialId || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, credentialId: e.target.value }))}
        />

        {/* URL */}
        <PremiumInput
          label="Verification URL (Optional)"
          type="url"
          value={formData.url || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
          helperText="Link to verify the certification"
        />
      </div>
    </PremiumModal>
  );
}

