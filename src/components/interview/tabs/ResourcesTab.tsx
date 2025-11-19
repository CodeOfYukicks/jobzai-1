import { memo } from 'react';
import { Building, MessageSquare, PlayCircle, BookmarkPlus, FileText, Share2, LinkIcon, X } from 'lucide-react';
import { Interview } from '../../../types/interview';
import { JobApplication } from '../../../types/job';
import { v4 as uuidv4 } from 'uuid';

interface ResourcesTabProps {
  application: JobApplication;
  resourcesData?: Interview['resourcesData'];
  newResourceTitle: string;
  newResourceUrl: string;
  setNewResourceTitle: (text: string) => void;
  setNewResourceUrl: (text: string) => void;
  setResourcesData: (data: Interview['resourcesData']) => void;
  saveResourcesData: (data: Interview['resourcesData']) => Promise<void>;
  shortenText: (text: string, max?: number) => string;
}

const ResourcesTab = memo(function ResourcesTab({
  application,
  resourcesData,
  newResourceTitle,
  newResourceUrl,
  setNewResourceTitle,
  setNewResourceUrl,
  setResourcesData,
  saveResourcesData,
  shortenText,
}: ResourcesTabProps) {
  const tips = [
    { id: 'research', title: 'Research the Company', description: 'Look up their mission, values, recent news, and products/services.', icon: <Building className="w-5 h-5 text-purple-600 dark:text-purple-400" /> },
    { id: 'star', title: 'Prepare Your STAR Stories', description: 'Create specific examples using the Situation, Task, Action, Result format.', icon: <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" /> },
    { id: 'practice', title: 'Practice Your Responses', description: 'Rehearse answers to common questions aloud or with a friend.', icon: <PlayCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" /> },
    { id: 'ask', title: 'Prepare Questions to Ask', description: 'Have thoughtful questions ready about the role, team, and company.', icon: <BookmarkPlus className="w-5 h-5 text-purple-600 dark:text-purple-400" /> },
    { id: 'jd', title: 'Review Job Description', description: 'Align your talking points with the skills and qualifications listed.', icon: <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" /> },
    { id: 'presentation', title: 'Plan Your Presentation', description: 'Prepare what to wear, test your tech for virtual interviews, plan your route.', icon: <Share2 className="w-5 h-5 text-purple-600 dark:text-purple-400" /> }
  ];

  const defaultResources = [
    { id:'glassdoor', title: 'Company Glassdoor Reviews', url: `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(application.companyName)}`, description: 'Check employee reviews and interview experiences' },
    { id:'linkedin', title: 'LinkedIn Company Page', url: `https://www.linkedin.com/company/${encodeURIComponent(application.companyName)}`, description: 'Research employees and company updates' },
    { id:'db', title: 'Interview Question Database', url: `https://www.glassdoor.com/Interview/index.htm`, description: 'Browse thousands of real interview questions' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-3 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">Preparation Tips</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tips.map((tip) => {
            const checked = resourcesData?.reviewedTips?.includes(tip.id);
            return (
              <div key={tip.id}
                className={`p-5 rounded-xl shadow-sm border ${checked ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className="mr-3 mt-0.5">{tip.icon}</div>
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-white text-base mb-1">{tip.title}</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{tip.description}</p>
                    </div>
                  </div>
                  <div>
                    <input 
                      type="checkbox" 
                      checked={!!checked} 
                      onChange={async ()=>{
                        const list = new Set(resourcesData?.reviewedTips || []);
                        if (checked) list.delete(tip.id); else list.add(tip.id);
                        const next = { ...(resourcesData||{}), reviewedTips: Array.from(list) } as Interview['resourcesData'];
                        setResourcesData(next);
                        await saveResourcesData(next);
                      }} 
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="md:col-span-3 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">Helpful Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {defaultResources.map((resource) => (
            <a 
              key={resource.id}
              className="flex items-start p-5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors hover:shadow-sm"
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="mr-3 mt-0.5 text-purple-600 dark:text-purple-400">
                <LinkIcon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800 dark:text-white text-base mb-1">{resource.title}</div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{resource.description}</p>
              </div>
            </a>
          ))}
        </div>
        <div className="mt-6 p-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">Your resources</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {(resourcesData?.savedLinks||[]).map(link => (
              <div key={link.id} className="relative p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow bg-white dark:bg-gray-800 group">
                <button 
                  onClick={async ()=>{
                    const updated = { ...(resourcesData||{}), savedLinks: (resourcesData?.savedLinks||[]).filter(l => l.id !== link.id) } as Interview['resourcesData'];
                    setResourcesData(updated);
                    await saveResourcesData(updated);
                  }} 
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-opacity p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-start gap-3 pr-8">
                  <div className="mt-0.5 text-purple-600 dark:text-purple-400 flex-shrink-0"><LinkIcon className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-800 dark:text-white text-sm hover:text-purple-700 dark:hover:text-purple-300 block mb-1 truncate" title={link.title}>{link.title}</a>
                    <div className="text-xs text-gray-500 truncate" title={link.url}>{shortenText(link.url, 40)}</div>
                  </div>
                </div>
              </div>
            ))}
            {(!resourcesData?.savedLinks || resourcesData.savedLinks.length === 0) && (
              <div className="text-sm text-gray-500 dark:text-gray-400 col-span-full text-center py-4">No custom resources yet. Add one below.</div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input 
              value={newResourceTitle} 
              onChange={(e)=>setNewResourceTitle(e.target.value)} 
              placeholder="Title" 
              className="px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
            />
            <input 
              value={newResourceUrl} 
              onChange={(e)=>setNewResourceUrl(e.target.value)} 
              placeholder="https://..." 
              className="px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
            />
            <button 
              onClick={async ()=>{
                const t = newResourceTitle.trim();
                const u = newResourceUrl.trim();
                if (!t || !u) return;
                const newLink = { id: uuidv4(), title: t, url: u };
                const updated = { ...(resourcesData||{}), savedLinks: [ ...(resourcesData?.savedLinks || []), newLink ] } as Interview['resourcesData'];
                setResourcesData(updated);
                setNewResourceTitle(''); 
                setNewResourceUrl('');
                await saveResourcesData(updated);
              }} 
              className="px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ResourcesTab;

