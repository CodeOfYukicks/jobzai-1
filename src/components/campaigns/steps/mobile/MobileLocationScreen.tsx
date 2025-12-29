import { CampaignData } from '../../NewCampaignModal';
import LocationAutocomplete from '../../LocationAutocomplete';

import MobileProspectsCard from './MobileProspectsCard';

interface MobileLocationScreenProps {
    data: CampaignData;
    onUpdate: (updates: Partial<CampaignData>) => void;
    estimatedProspects: number | null;
    isLoadingPreview: boolean;
}

export default function MobileLocationScreen({
    data,
    onUpdate,
    estimatedProspects,
    isLoadingPreview
}: MobileLocationScreenProps) {
    const handleAddLocation = (location: string) => {
        if (location.trim() && !data.personLocations.includes(location.trim())) {
            onUpdate({ personLocations: [...data.personLocations, location.trim()] });
        }
    };

    const handleRemoveLocation = (location: string) => {
        onUpdate({ personLocations: data.personLocations.filter(l => l !== location) });
    };

    return (
        <div className="flex flex-col h-full">
            <div className="mb-6">
                <h2 className="text-[24px] font-semibold text-gray-900 dark:text-white tracking-tight mb-2">
                    Where are they located?
                </h2>
                <p className="text-[15px] text-gray-500 dark:text-white/40 leading-relaxed">
                    Add one or more cities, regions, or 'Remote'.
                </p>
            </div>

            <div className="flex-1 flex flex-col">
                <LocationAutocomplete
                    selectedLocations={data.personLocations}
                    onAddLocation={handleAddLocation}
                    onRemoveLocation={handleRemoveLocation}
                    placeholder="Search for a city or country..."
                />

                <MobileProspectsCard
                    count={estimatedProspects}
                    isLoading={isLoadingPreview}
                    showExplanation={true}
                />
            </div>
        </div>
    );
}
