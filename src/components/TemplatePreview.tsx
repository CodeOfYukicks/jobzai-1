import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

interface TemplatePreviewProps {
  content: string;
  className?: string;
}

export default function TemplatePreview({ content, className = '' }: TemplatePreviewProps) {
  const [previewData, setPreviewData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    company: 'Acme Corp',
    jobPosition: 'Senior Developer',
    fullName: 'John Doe',
    salutation: 'Hi'
  });
  const [showFields, setShowFields] = useState(false);

  const replaceFields = (text: string) => {
    // Handle both formats of merge fields
    return text
      // Replace parenthesis format
      .replace(/\(First name\)/g, previewData.firstName)
      .replace(/\(Last name\)/g, previewData.lastName)
      .replace(/\(Company\)/g, previewData.company)
      .replace(/\(Job position\)/g, previewData.jobPosition)
      .replace(/\(Full name\)/g, previewData.fullName)
      // Replace AI-generated field format
      .replace(/salutationField/g, previewData.salutation)
      .replace(/firstNameField/g, previewData.firstName)
      .replace(/lastNameField/g, previewData.lastName)
      .replace(/companyField/g, previewData.company);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">Preview</h3>
        <button
          onClick={() => setShowFields(!showFields)}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          {showFields ? (
            <>
              <EyeOff className="h-4 w-4 mr-1" />
              Hide Fields
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-1" />
              Show Fields
            </>
          )}
        </button>
      </div>

      {showFields && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              value={previewData.firstName}
              onChange={(e) => setPreviewData(prev => ({ 
                ...prev, 
                firstName: e.target.value,
                fullName: `${e.target.value} ${prev.lastName}`
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              value={previewData.lastName}
              onChange={(e) => setPreviewData(prev => ({ 
                ...prev, 
                lastName: e.target.value,
                fullName: `${prev.firstName} ${e.target.value}`
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Company</label>
            <input
              type="text"
              value={previewData.company}
              onChange={(e) => setPreviewData(prev => ({ ...prev, company: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Job Position</label>
            <input
              type="text"
              value={previewData.jobPosition}
              onChange={(e) => setPreviewData(prev => ({ ...prev, jobPosition: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Salutation</label>
            <input
              type="text"
              value={previewData.salutation}
              onChange={(e) => setPreviewData(prev => ({ ...prev, salutation: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-50 p-4 rounded-lg"
      >
        <div className="whitespace-pre-wrap font-sans text-sm text-gray-700">
          {replaceFields(content)}
        </div>
      </motion.div>
    </div>
  );
}
