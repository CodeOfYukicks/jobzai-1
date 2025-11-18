import { Users } from 'lucide-react';
import { useState } from 'react';
import InsightsModal from './InsightsModal';

export default function NetworkCard() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[hsl(var(--primary))]/10 rounded-lg">
                <Users className="h-5 w-5 text-[hsl(var(--primary))]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Network Insights</h3>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Analyze and expand your professional network
            </p>
          </div>
        </div>

        {/* Preview Metrics */}
        <div className="grid grid-cols-3 gap-4 my-6">
          <div className="text-center">
            <div className="text-lg font-bold text-[#4D3E78]">720</div>
            <div className="text-xs text-gray-500">Connection Score</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[#4D3E78]">65%</div>
            <div className="text-xs text-gray-500">Industry Reach</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[#4D3E78]">High</div>
            <div className="text-xs text-gray-500">Growth Potential</div>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-6">
          <li className="flex items-center text-sm text-gray-600">
            <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))] mr-2" />
            Connection recommendations
          </li>
          <li className="flex items-center text-sm text-gray-600">
            <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))] mr-2" />
            Engagement strategies
          </li>
          <li className="flex items-center text-sm text-gray-600">
            <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))] mr-2" />
            Event suggestions
          </li>
        </ul>

        {/* Action Button */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-2 px-4 bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary))]/20 transition-colors"
        >
          View Details
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <InsightsModal
          category="network"
          title="Network"
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

export { NetworkCard as default };
// ou
export default NetworkCard; 
