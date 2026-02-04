import { useState, useEffect } from 'react';

interface KanbanTutorialBarProps {
    onDismiss: () => void;
}

export const KanbanTutorialBar = ({ onDismiss }: KanbanTutorialBarProps) => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const handleNextStep = () => {
            setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
        };

        window.addEventListener('tutorial-add-application-clicked', handleNextStep);
        window.addEventListener('tutorial-application-created', handleNextStep);
        return () => {
            window.removeEventListener('tutorial-add-application-clicked', handleNextStep);
            window.removeEventListener('tutorial-application-created', handleNextStep);
        };
    }, []);

    // Simple steps configuration - can be expanded later
    const steps = [
        {
            text: "Welcome, let's add your first job! Hover over the + Add Application button on the top right of the board and click Job",
            color: "bg-[#6366F1]" // Indigo/Purple
        },
        {
            text: "Great! Now paste the job posting URL to let AI extract details automatically, or enter them manually.",
            color: "bg-[#6366F1]" // Keep same color for continuity
        },
        {
            text: "Success! Your application has been created. You can now track its progress on this Kanban board.",
            color: "bg-[#10B981]" // Green/Emerald for success
        }
    ];

    return (
        <div className="relative w-full z-[60]">
            <div
                className={`${steps[currentStep].color} text-white px-4 py-2 shadow-md flex items-center justify-between min-h-[40px]`}
            >
                {/* Left side spacer to balance the close button if we want perfect centering */}
                <div className="flex-1"></div>

                <div className="flex items-center justify-center gap-2 text-sm font-medium text-center flex-[2]">
                    {steps[currentStep].text.includes('+ Add Application') ? (
                        <>
                            <span>{steps[currentStep].text.split('+ Add Application')[0]}</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded bg-[#9ff019] text-gray-900 shadow-sm mx-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus w-3 h-3"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                                Add Application
                            </span>
                            <span>{steps[currentStep].text.split('+ Add Application')[1]}</span>
                        </>
                    ) : (
                        <span>{steps[currentStep].text}</span>
                    )}
                </div>

                <div className="flex-1 flex justify-end">
                    <button
                        onClick={onDismiss}
                        className="px-3 py-1 text-xs font-medium bg-white/20 hover:bg-white/30 
              border border-white/20 rounded-md transition-colors text-white backdrop-blur-sm"
                    >
                        Skip Tour
                    </button>
                </div>
            </div>
        </div>
    );
};
