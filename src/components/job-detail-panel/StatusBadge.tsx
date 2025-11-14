import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import { JobApplication } from '../../types/job';

type Status = JobApplication['status'];

const statusOptions: { value: Status; label: string; color: string }[] = [
  { value: 'applied', label: 'Applied', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50' },
  { value: 'interview', label: 'Interview', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/50' },
  { value: 'offer', label: 'Offer', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50' },
  { value: 'pending_decision', label: 'Pending Decision', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50' },
  { value: 'archived', label: 'Archived', color: 'bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700' },
];

interface StatusBadgeProps {
  status: Status;
  isEditing: boolean;
  onChange: (status: Status) => void;
}

export const StatusBadge = ({ status, isEditing, onChange }: StatusBadgeProps) => {
  const currentStatus = statusOptions.find((s) => s.value === status) || statusOptions[0];

  if (!isEditing) {
    return (
      <div className="inline-flex">
        <span className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${currentStatus.color}`}>
          {currentStatus.label}
        </span>
      </div>
    );
  }

  return (
    <Listbox value={status} onChange={onChange}>
      <div className="relative inline-block">
        <Listbox.Button
          className={`relative w-full cursor-pointer rounded-xl border pl-4 pr-10 py-2.5 text-left shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 ${currentStatus.color}`}
        >
          <span className="block truncate text-sm font-medium">{currentStatus.label}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </span>
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-10 mt-2 max-h-60 w-56 overflow-auto rounded-xl bg-white dark:bg-gray-800 py-2 shadow-xl ring-1 ring-black/5 dark:ring-gray-700 focus:outline-none">
            {statusOptions.map((option) => (
              <Listbox.Option
                key={option.value}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2.5 pl-10 pr-4 transition-colors ${
                    active ? 'bg-gray-50 dark:bg-gray-700' : ''
                  }`
                }
                value={option.value}
              >
                {({ selected }) => (
                  <>
                    <span className={`block truncate text-sm text-gray-900 dark:text-gray-100 ${selected ? 'font-semibold' : 'font-normal'}`}>
                      {option.label}
                    </span>
                    {selected && (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600 dark:text-blue-400">
                        <Check className="h-4 w-4" aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
};

