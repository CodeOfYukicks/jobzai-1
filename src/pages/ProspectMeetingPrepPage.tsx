import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useAssistant } from '../contexts/AssistantContext';
import { useAssistantPageData } from '../hooks/useAssistantPageData';
import { useAvatarConfig } from '../hooks/useAvatarConfig';
import { notify } from '../lib/notify';
import AuthLayout from '../components/AuthLayout';
import {
    ArrowLeft,
    Mail,
    Phone,
    Linkedin,
    FileText,
    Plus,
    ChevronRight,
    ChevronLeft,
    Loader2,
    Copy,
    Check,
    Save,
    Trash2,
    Square,
    CheckSquare,
    Pencil,
    Palette
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO, isValid } from 'date-fns';
import { ProfileAvatar, generateGenderedAvatarConfigByName } from '../components/profile/avatar';
import { WarmthIndicator } from '../components/outreach/WarmthIndicator';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { queryPerplexity } from '../lib/perplexity';
import {
    JobApplication,
    Meeting,
    MEETING_TYPE_LABELS
} from '../types/job';
import {
    NotionDocument,
    getNotes,
    createNote,
    updateNote as updateNoteService
} from '../lib/notionDocService';
import NotionEditor, { NotionEditorRef } from '../components/notion-editor/NotionEditor';


// Helper to parse dates
const parseDate = (dateValue: any): Date => {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date) return dateValue;
    if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
        return dateValue.toDate();
    }
    if (typeof dateValue === 'number') return new Date(dateValue);
    if (typeof dateValue === 'string') {
        const parsed = parseISO(dateValue);
        return isValid(parsed) ? parsed : new Date();
    }
    return new Date();
};

interface ProspectInsights {
    companyInfo: string;
    industryOverview: string;
    roleContext: string;
    talkingPoints: string[];
    recentNews?: string;
}

export default function ProspectMeetingPrepPage() {
    const { applicationId, meetingId } = useParams<{ applicationId: string; meetingId: string }>();
    const { currentUser } = useAuth();
    const {
        isOpen: isAssistantOpen,
        registerNoteEditor,
        unregisterNoteEditor,
        setEditorSelection,
        inlineEdit,
        confirmInlineEdit,
        rejectInlineEdit,
    } = useAssistant();
    const navigate = useNavigate();
    const editorRef = useRef<NotionEditorRef>(null);
    const { avatarConfig } = useAvatarConfig();

    // State
    const [application, setApplication] = useState<JobApplication | null>(null);
    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [insights, setInsights] = useState<ProspectInsights | null>(null);
    const [isLoadingInsights, setIsLoadingInsights] = useState(false);
    const [notes, setNotes] = useState<NotionDocument[]>([]);
    const [isCreatingNote, setIsCreatingNote] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [selectedNote, setSelectedNote] = useState<NotionDocument | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Checklist state (stored in application.meetingChecklist)
    interface ChecklistItem {
        id: string;
        text: string;
        completed: boolean;
    }
    const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
    const [newChecklistItem, setNewChecklistItem] = useState('');

    // Note title editing
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editingTitleValue, setEditingTitleValue] = useState('');
    const titleInputRef = useRef<HTMLInputElement>(null);

    // Resizable panel state (vertical)
    const [leftPanelWidth, setLeftPanelWidth] = useState(400); // pixels
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Resizable horizontal divider state (prospect info vs checklist)
    const [prospectInfoHeight, setProspectInfoHeight] = useState<number | null>(null); // null = auto
    const [isHorizontalDragging, setIsHorizontalDragging] = useState(false);
    const leftPanelRef = useRef<HTMLDivElement>(null);

    // Section background colors
    const sectionColors = [
        { id: 'default', bg: 'transparent', label: 'Default' },
        { id: 'purple', bg: 'rgba(99, 91, 255, 0.08)', label: 'Purple' },
        { id: 'blue', bg: 'rgba(59, 130, 246, 0.08)', label: 'Blue' },
        { id: 'green', bg: 'rgba(16, 185, 129, 0.08)', label: 'Green' },
        { id: 'amber', bg: 'rgba(245, 158, 11, 0.08)', label: 'Amber' },
        { id: 'rose', bg: 'rgba(244, 63, 94, 0.08)', label: 'Rose' },
        { id: 'lime', bg: 'rgba(183, 226, 25, 0.12)', label: 'Lime' },
    ];
    const [prospectSectionColor, setProspectSectionColor] = useState('default');
    const [checklistSectionColor, setChecklistSectionColor] = useState('default');
    const [showProspectColorPicker, setShowProspectColorPicker] = useState(false);
    const [showChecklistColorPicker, setShowChecklistColorPicker] = useState(false);

    const getColorBg = (colorId: string) => sectionColors.find(c => c.id === colorId)?.bg || 'transparent';

    // Prepare meeting prep data for AI assistant
    const meetingPrepData = useMemo(() => {
        if (!application || !meeting) return null;

        const contactName = application.contactName || application.company || 'Prospect';
        const meetingType = meeting.type ? MEETING_TYPE_LABELS[meeting.type] || meeting.type : 'Meeting';

        return {
            // Prospect information
            prospect: {
                name: contactName,
                role: application.contactRole || null,
                company: application.company,
                email: application.contactEmail || null,
                phone: application.contactPhone || null,
                linkedinUrl: application.linkedinUrl || null,
            },
            // Company context
            company: {
                name: application.company,
                position: application.position,
                location: application.location || null,
            },
            // Meeting details
            meeting: {
                type: meetingType,
                date: meeting.date,
                time: meeting.time || null,
                notes: meeting.notes || null,
            },
            // AI-generated insights (if available)
            insights: insights ? {
                companyInfo: insights.companyInfo,
                industryOverview: insights.industryOverview,
                roleContext: insights.roleContext,
                talkingPoints: insights.talkingPoints,
                recentNews: insights.recentNews || null,
            } : null,
            // Current note being edited
            currentNote: selectedNote ? {
                id: selectedNote.id,
                title: selectedNote.title,
                content: selectedNote.content,
            } : null,
            // All notes for this meeting
            allNotes: notes.map(n => ({
                id: n.id,
                title: n.title,
            })),
        };
    }, [application, meeting, insights, selectedNote, notes]);

    // Register meeting prep data with AI assistant
    useAssistantPageData('meetingPrep', meetingPrepData, !!meetingPrepData);

    // Load application and meeting data
    useEffect(() => {
        const loadData = async () => {
            if (!currentUser || !applicationId || !meetingId) {
                navigate('/applications');
                return;
            }

            setIsLoading(true);
            try {
                // Load application
                const appRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
                const appSnap = await getDoc(appRef);

                if (!appSnap.exists()) {
                    notify.error('Application not found');
                    navigate('/applications');
                    return;
                }

                const appData = { id: appSnap.id, ...appSnap.data() } as JobApplication;
                setApplication(appData);

                // Find the meeting
                const meetingData = appData.meetings?.find(m => m.id === meetingId);
                if (!meetingData) {
                    // Fallback: check interviews array (for backwards compatibility)
                    const interviewData = appData.interviews?.find(i => i.id === meetingId);
                    if (interviewData) {
                        // Convert interview to meeting format
                        setMeeting({
                            id: interviewData.id,
                            date: interviewData.date,
                            time: interviewData.time,
                            type: interviewData.type as any,
                            status: interviewData.status as any,
                            notes: interviewData.notes,
                            location: interviewData.location,
                            attendees: interviewData.interviewers,
                        });
                    } else {
                        notify.error('Meeting not found');
                        navigate('/applications');
                        return;
                    }
                } else {
                    setMeeting(meetingData);
                }

                // Load notes linked to this application
                const loadedNotes = await getNotes(currentUser.uid);

                // Filter to only show notes linked to this application
                const linkedNoteIds = appData.linkedNoteIds || [];
                setNotes(loadedNotes.filter((n: NotionDocument) => linkedNoteIds.includes(n.id)));

            } catch (error) {
                console.error('Error loading data:', error);
                notify.error('Failed to load meeting details');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [currentUser, applicationId, meetingId, navigate]);

    // Generate AI insights
    const generateInsights = useCallback(async () => {
        if (!application) return;

        setIsLoadingInsights(true);
        try {
            const prompt = `
I'm preparing for a meeting with ${application.contactName || 'a prospect'} who works as ${application.contactRole || 'unknown role'} at ${application.companyName}.

Please provide:
1. A brief company overview (2-3 sentences focusing on what they do, size, and industry)
2. Industry context (1-2 sentences about their industry and trends)
3. Role context (what does a ${application.contactRole || 'professional'} typically do at a company like this)
4. 4-5 specific talking points or questions I should prepare for this meeting
5. Any recent company news if available (optional)

Format your response as JSON like this:
{
  "companyInfo": "...",
  "industryOverview": "...",
  "roleContext": "...",
  "talkingPoints": ["...", "...", "...", "..."],
  "recentNews": "..." 
}

Company website if known: ${application.contactCompanyWebsite || 'Not provided'}
Company industry: ${application.contactCompanyIndustry || 'Not specified'}
`;

            const response = await queryPerplexity(prompt);
            let content: any = response?.text ?? response?.choices?.[0]?.message?.content ?? '';
            if (typeof content !== 'string') content = String(content ?? '');

            // Clean thinking tags
            content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

            // Parse JSON
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;

            const parsed = JSON.parse(jsonString);
            setInsights({
                companyInfo: parsed.companyInfo || '',
                industryOverview: parsed.industryOverview || '',
                roleContext: parsed.roleContext || '',
                talkingPoints: parsed.talkingPoints || [],
                recentNews: parsed.recentNews
            });

            notify.success('Insights generated');
        } catch (error) {
            console.error('Error generating insights:', error);
            notify.error('Failed to generate insights');
        } finally {
            setIsLoadingInsights(false);
        }
    }, [application]);

    // Auto-generate insights when application loads
    useEffect(() => {
        if (application && !insights && !isLoadingInsights) {
            generateInsights();
        }
    }, [application, insights, isLoadingInsights, generateInsights]);

    // Create new note linked to this application
    const handleCreateNote = async () => {
        if (!currentUser || !applicationId || !application) return;

        setIsCreatingNote(true);
        try {
            const newNote = await createNote({
                userId: currentUser.uid,
                title: `Meeting Notes: ${application.contactName || application.companyName}`,
            });

            // Link note to application
            const appRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
            const linkedNoteIds = application.linkedNoteIds || [];
            await updateDoc(appRef, {
                linkedNoteIds: [...linkedNoteIds, newNote.id],
                updatedAt: serverTimestamp()
            });

            setNotes(prev => [newNote, ...prev]);
            notify.success('Note created!');
            // Select the new note to edit inline instead of navigating
            setSelectedNote(newNote);
        } catch (error) {
            console.error('Error creating note:', error);
            notify.error('Failed to create note');
        } finally {
            setIsCreatingNote(false);
        }
    };

    // Handle note content change with debounced auto-save
    const handleNoteChange = useCallback(async (content: any) => {
        if (!selectedNote || !currentUser) return;

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Update local state immediately
        setSelectedNote(prev => prev ? { ...prev, content } : null);
        setNotes(prev => prev.map(n => n.id === selectedNote.id ? { ...n, content } : n));

        // Debounced save
        saveTimeoutRef.current = setTimeout(async () => {
            setIsSaving(true);
            try {
                await updateNoteService({
                    userId: currentUser.uid,
                    noteId: selectedNote.id,
                    updates: { content }
                });
            } catch (error) {
                console.error('Error saving note:', error);
            } finally {
                setIsSaving(false);
            }
        }, 1000);
    }, [selectedNote, currentUser]);

    // Select a note for inline editing
    const handleSelectNote = useCallback((note: NotionDocument) => {
        setSelectedNote(note);
    }, []);

    // Go back to notes list
    const handleBackToNotes = useCallback(() => {
        setSelectedNote(null);
        setIsEditingTitle(false);
    }, []);

    // Handle note title edit
    const handleStartEditTitle = useCallback(() => {
        if (selectedNote) {
            setEditingTitleValue(selectedNote.title);
            setIsEditingTitle(true);
            setTimeout(() => titleInputRef.current?.focus(), 0);
        }
    }, [selectedNote]);

    const handleSaveTitle = useCallback(async () => {
        if (!selectedNote || !currentUser || !editingTitleValue.trim()) {
            setIsEditingTitle(false);
            return;
        }

        const newTitle = editingTitleValue.trim();
        setIsEditingTitle(false);

        // Update local state
        setSelectedNote(prev => prev ? { ...prev, title: newTitle } : null);
        setNotes(prev => prev.map(n => n.id === selectedNote.id ? { ...n, title: newTitle } : n));

        // Save to Firebase
        try {
            await updateNoteService({
                userId: currentUser.uid,
                noteId: selectedNote.id,
                updates: { title: newTitle }
            });
        } catch (error) {
            console.error('Error updating title:', error);
        }
    }, [selectedNote, currentUser, editingTitleValue]);

    // Checklist handlers
    const handleAddChecklistItem = useCallback(() => {
        if (!newChecklistItem.trim()) return;
        const newItem: ChecklistItem = {
            id: Date.now().toString(),
            text: newChecklistItem.trim(),
            completed: false
        };
        setChecklist(prev => [...prev, newItem]);
        setNewChecklistItem('');
    }, [newChecklistItem]);

    const handleToggleChecklistItem = useCallback((itemId: string) => {
        setChecklist(prev => prev.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
        ));
    }, []);

    const handleRemoveChecklistItem = useCallback((itemId: string) => {
        setChecklist(prev => prev.filter(item => item.id !== itemId));
    }, []);

    // Handle selection changes for the AI assistant
    const handleSelectionChange = useCallback(
        (selection: { from: number; to: number; text: string } | null) => {
            setEditorSelection(selection);
        },
        [setEditorSelection]
    );

    // Register note editor with AI Assistant when a note is selected
    useEffect(() => {
        if (selectedNote && editorRef.current) {
            registerNoteEditor({
                onContentChange: handleNoteChange,
                getContent: () => editorRef.current?.getContent() || null,
                getSelection: () => editorRef.current?.getSelection() || null,
                setContent: (content: any) => editorRef.current?.setContent(content),
                replaceSelection: (content: string | any, range?: { from: number; to: number }) =>
                    editorRef.current?.replaceSelection(content, range),
            });
        }

        return () => {
            if (selectedNote) {
                unregisterNoteEditor();
            }
        };
    }, [selectedNote, registerNoteEditor, unregisterNoteEditor, handleNoteChange]);

    // Handle resizable divider drag
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !containerRef.current) return;
            const containerRect = containerRef.current.getBoundingClientRect();
            const newWidth = e.clientX - containerRect.left;
            // Limit between 250px and 60% of container
            const maxWidth = containerRect.width * 0.6;
            setLeftPanelWidth(Math.max(250, Math.min(newWidth, maxWidth)));
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    // Handle horizontal resizable divider drag
    const handleHorizontalMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsHorizontalDragging(true);
    }, []);

    useEffect(() => {
        const handleHorizontalMouseMove = (e: MouseEvent) => {
            if (!isHorizontalDragging || !leftPanelRef.current) return;
            const panelRect = leftPanelRef.current.getBoundingClientRect();
            const newHeight = e.clientY - panelRect.top;
            // Limit between 150px and 80% of panel height
            const maxHeight = panelRect.height * 0.8;
            setProspectInfoHeight(Math.max(150, Math.min(newHeight, maxHeight)));
        };

        const handleHorizontalMouseUp = () => {
            setIsHorizontalDragging(false);
        };

        if (isHorizontalDragging) {
            document.addEventListener('mousemove', handleHorizontalMouseMove);
            document.addEventListener('mouseup', handleHorizontalMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleHorizontalMouseMove);
            document.removeEventListener('mouseup', handleHorizontalMouseUp);
        };
    }, [isHorizontalDragging]);

    // Copy to clipboard
    const handleCopy = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (isLoading) {
        return (
            <AuthLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 text-[#635BFF] animate-spin" />
                        <p className="text-gray-500 dark:text-gray-400">Loading meeting details...</p>
                    </div>
                </div>
            </AuthLayout>
        );
    }

    if (!application || !meeting) {
        return (
            <AuthLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">Meeting not found</p>
                        <button
                            onClick={() => navigate('/applications')}
                            className="mt-4 text-[#635BFF] hover:underline"
                        >
                            Go back to applications
                        </button>
                    </div>
                </div>
            </AuthLayout>
        );
    }

    const contactName = application.contactName || 'Unknown Contact';
    const meetingDate = parseDate(meeting.date);
    const meetingType = MEETING_TYPE_LABELS[meeting.type as keyof typeof MEETING_TYPE_LABELS] || meeting.type;

    return (
        <AuthLayout>
            <div className="h-screen flex flex-col bg-white dark:bg-[#242325] overflow-hidden">
                {/* Minimal Header - integrated into page */}
                <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-[#3d3c3e]">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3d3c3e] transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                        <div>
                            <h1 className="text-base font-semibold text-gray-900 dark:text-white">
                                {meetingType} with {contactName}
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {format(meetingDate, 'EEEE, MMMM d')} at {meeting.time}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Content - Quadrant Layout */}
                <div ref={containerRef} className="flex-1 flex overflow-hidden">
                    {/* Left Side - Resizable */}
                    <div
                        ref={leftPanelRef}
                        className="flex flex-col flex-shrink-0"
                        style={{ width: leftPanelWidth }}
                    >

                        {/* Top: Prospect Profile & Contact Info */}
                        <div
                            className="overflow-y-auto flex-shrink-0 relative"
                            style={{
                                ...(prospectInfoHeight ? { height: prospectInfoHeight } : { flex: '1 1 auto' }),
                                backgroundColor: getColorBg(prospectSectionColor)
                            }}
                        >
                            {/* Color Picker Button */}
                            <button
                                onClick={() => setShowProspectColorPicker(!showProspectColorPicker)}
                                className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] transition-colors z-10"
                                title="Change background color"
                            >
                                <Palette className="w-4 h-4" />
                            </button>
                            {/* Color Picker Dropdown */}
                            {showProspectColorPicker && (
                                <div className="absolute top-10 right-3 z-20 bg-white dark:bg-[#2b2a2c] rounded-lg shadow-lg border border-gray-200 dark:border-[#3d3c3e] p-2 flex gap-1.5">
                                    {sectionColors.map(color => (
                                        <button
                                            key={color.id}
                                            onClick={() => {
                                                setProspectSectionColor(color.id);
                                                setShowProspectColorPicker(false);
                                            }}
                                            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${prospectSectionColor === color.id
                                                ? 'border-gray-900 dark:border-white scale-110'
                                                : 'border-gray-200 dark:border-gray-600'
                                                }`}
                                            style={{ backgroundColor: color.id === 'default' ? '#f3f4f6' : color.bg.replace('0.08', '0.5').replace('0.12', '0.6') }}
                                            title={color.label}
                                        />
                                    ))}
                                </div>
                            )}
                            {/* Profile Header - Clean hero section */}
                            <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2b2a2c]">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <ProfileAvatar
                                            config={generateGenderedAvatarConfigByName(contactName)}
                                            size={52}
                                            className="rounded-xl flex-shrink-0 ring-2 ring-white dark:ring-[#3d3c3e] shadow-sm"
                                        />
                                        {application.warmthLevel && Number(application.warmthLevel) >= 3 && (
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#242325] flex items-center justify-center">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                                            {contactName}
                                        </h2>
                                        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                                            {application.contactRole && (
                                                <span className="truncate">{application.contactRole}</span>
                                            )}
                                            {application.contactRole && application.companyName && (
                                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                            )}
                                            <div className="flex items-center gap-1.5">
                                                <CompanyLogo companyName={application.companyName} size="sm" />
                                                <span className="truncate">{application.companyName}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Info - Clean copyable rows */}
                            <div className="px-5 py-3 space-y-1">
                                {/* Email */}
                                {application.contactEmail && (
                                    <button
                                        onClick={() => handleCopy(application.contactEmail!, 'email')}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2b2a2c] transition-colors group"
                                    >
                                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1 text-left">{application.contactEmail}</span>
                                        {copiedField === 'email' ? (
                                            <Check className="w-4 h-4 text-emerald-500" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        )}
                                    </button>
                                )}

                                {/* Phone */}
                                {application.contactPhone && (
                                    <button
                                        onClick={() => handleCopy(application.contactPhone!, 'phone')}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2b2a2c] transition-colors group"
                                    >
                                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1 text-left">{application.contactPhone}</span>
                                        {copiedField === 'phone' ? (
                                            <Check className="w-4 h-4 text-emerald-500" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        )}
                                    </button>
                                )}

                                {/* LinkedIn - as a link row */}
                                {application.contactLinkedIn && (
                                    <a
                                        href={application.contactLinkedIn}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2b2a2c] transition-colors group"
                                    >
                                        <Linkedin className="w-4 h-4 text-[#0A66C2] flex-shrink-0" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1 text-left">View LinkedIn Profile</span>
                                        <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </a>
                                )}
                            </div>

                            {/* Status badges - subtle at the bottom */}
                            {(application.warmthLevel || application.outreachChannel) && (
                                <div className="px-5 pb-3 flex items-center gap-2">
                                    {application.warmthLevel && (
                                        <WarmthIndicator level={application.warmthLevel} size="sm" />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Horizontal Resizable Divider */}
                        <div
                            onMouseDown={handleHorizontalMouseDown}
                            className={`h-px flex-shrink-0 cursor-row-resize group relative
                                ${isHorizontalDragging
                                    ? 'bg-[#635BFF]'
                                    : 'bg-gray-200 dark:bg-[#3d3c3e] hover:bg-[#635BFF]/50'
                                } transition-colors`}
                        >
                            <div className={`absolute inset-x-0 -top-0.5 -bottom-0.5 ${isHorizontalDragging ? '' : 'group-hover:bg-[#635BFF]/10'}`} />
                        </div>

                        {/* Bottom: Prep Checklist */}
                        <div
                            className="flex-1 overflow-y-auto relative"
                            style={{ backgroundColor: getColorBg(checklistSectionColor) }}
                        >
                            {/* Color Picker Button */}
                            <button
                                onClick={() => setShowChecklistColorPicker(!showChecklistColorPicker)}
                                className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] transition-colors z-10"
                                title="Change background color"
                            >
                                <Palette className="w-4 h-4" />
                            </button>
                            {/* Color Picker Dropdown */}
                            {showChecklistColorPicker && (
                                <div className="absolute top-10 right-3 z-20 bg-white dark:bg-[#2b2a2c] rounded-lg shadow-lg border border-gray-200 dark:border-[#3d3c3e] p-2 flex gap-1.5">
                                    {sectionColors.map(color => (
                                        <button
                                            key={color.id}
                                            onClick={() => {
                                                setChecklistSectionColor(color.id);
                                                setShowChecklistColorPicker(false);
                                            }}
                                            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${checklistSectionColor === color.id
                                                ? 'border-gray-900 dark:border-white scale-110'
                                                : 'border-gray-200 dark:border-gray-600'
                                                }`}
                                            style={{ backgroundColor: color.id === 'default' ? '#f3f4f6' : color.bg.replace('0.08', '0.5').replace('0.12', '0.6') }}
                                            title={color.label}
                                        />
                                    ))}
                                </div>
                            )}
                            <div className="px-5 py-4">
                                <p className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium mb-3">
                                    Prep Checklist
                                </p>
                                <div className="space-y-1.5">
                                    {checklist.map(item => (
                                        <div key={item.id} className="group flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggleChecklistItem(item.id)}
                                                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                            >
                                                {item.completed ? (
                                                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                                                ) : (
                                                    <Square className="w-4 h-4" />
                                                )}
                                            </button>
                                            <span className={`text-sm flex-1 ${item.completed ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {item.text}
                                            </span>
                                            <button
                                                onClick={() => handleRemoveChecklistItem(item.id)}
                                                className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    {/* Add new item input */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <Square className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                                        <input
                                            type="text"
                                            value={newChecklistItem}
                                            onChange={(e) => setNewChecklistItem(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                                            placeholder="Add item..."
                                            className="flex-1 text-sm bg-transparent border-none outline-none text-gray-600 dark:text-gray-400 placeholder-gray-400 dark:placeholder-gray-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Resizable Divider */}
                    <div
                        onMouseDown={handleMouseDown}
                        className={`w-px flex-shrink-0 cursor-col-resize group relative
                            ${isDragging
                                ? 'bg-[#635BFF]'
                                : 'bg-gray-200 dark:bg-[#3d3c3e] hover:bg-[#635BFF]/50'
                            } transition-colors`}
                    >
                        <div className={`absolute inset-y-0 -left-0.5 -right-0.5 ${isDragging ? '' : 'group-hover:bg-[#635BFF]/10'}`} />
                    </div>

                    {/* Right Side - Notes Section (shrinks when assistant is open) */}
                    <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isAssistantOpen ? 'mr-[440px]' : ''}`}>
                        {/* Notes Header */}
                        <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-[#3d3c3e]">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                {selectedNote && (
                                    <button
                                        onClick={handleBackToNotes}
                                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3d3c3e] transition-colors flex-shrink-0"
                                    >
                                        <ChevronLeft className="w-4 h-4 text-gray-500" />
                                    </button>
                                )}
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">
                                    Notes
                                </span>
                                {selectedNote && (
                                    <>
                                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                        {isEditingTitle ? (
                                            <input
                                                ref={titleInputRef}
                                                type="text"
                                                value={editingTitleValue}
                                                onChange={(e) => setEditingTitleValue(e.target.value)}
                                                onBlur={handleSaveTitle}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                                                className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#2b2a2c] rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-[#635BFF] min-w-[120px]"
                                                autoFocus
                                            />
                                        ) : (
                                            <button
                                                onClick={handleStartEditTitle}
                                                className="group flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 truncate transition-colors"
                                            >
                                                <span className="truncate">{selectedNote.title}</span>
                                                <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                            </button>
                                        )}
                                    </>
                                )}
                                {isSaving && (
                                    <span className="flex items-center gap-1 text-xs text-gray-400 ml-2 flex-shrink-0">
                                        <Save className="w-3 h-3 animate-pulse" />
                                        Saving...
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={handleCreateNote}
                                disabled={isCreatingNote}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#b7e219] text-gray-900 text-sm font-semibold hover:bg-[#a5cb17] border border-[#9fc015] transition-colors disabled:opacity-50 flex-shrink-0"
                            >
                                {isCreatingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                New Note
                            </button>
                        </div>

                        {/* Notes Content */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            {selectedNote ? (
                                /* Inline Note Editor */
                                <div className="flex flex-col h-full">
                                    <div className="flex-1 overflow-y-auto p-4">
                                        <NotionEditor
                                            ref={editorRef}
                                            key={selectedNote.id}
                                            content={selectedNote.content}
                                            onChange={handleNoteChange}
                                            onSelectionChange={handleSelectionChange}
                                            placeholder="Start typing your notes..."
                                            editable={true}
                                            autofocus={true}
                                            className="min-h-full"
                                            // AI inline editing props
                                            aiEditMode={inlineEdit.isActive}
                                            aiIsStreaming={inlineEdit.isStreaming}
                                            aiStreamingText={inlineEdit.streamingText}
                                            aiPendingContent={inlineEdit.pendingContent}
                                            aiSelectionRange={inlineEdit.selectedRange}
                                            onAIEditAccept={confirmInlineEdit}
                                            onAIEditReject={rejectInlineEdit}
                                            // Layout offsets for AI floating bar positioning
                                            sidebarWidth={0}
                                            assistantPanelWidth={isAssistantOpen ? 440 : 0}
                                            // Avatar config for premium AI writing indicator
                                            avatarConfig={avatarConfig}
                                        />
                                    </div>
                                </div>
                            ) : notes.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-[#2b2a2c] flex items-center justify-center mb-3">
                                        <FileText className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                        No documents yet
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-xs">
                                        Create a note to prepare for your meeting
                                    </p>
                                    <button
                                        onClick={handleCreateNote}
                                        disabled={isCreatingNote}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#635BFF] text-white text-sm font-medium hover:bg-[#5046e4] transition-colors disabled:opacity-50"
                                    >
                                        {isCreatingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                        Create Note
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4 p-6 overflow-y-auto">
                                    {/* Notes */}
                                    {notes.map(note => (
                                        <motion.div
                                            key={note.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={() => handleSelectNote(note)}
                                            className="p-4 rounded-xl border border-gray-200 dark:border-[#3d3c3e] hover:border-[#635BFF]/50 hover:shadow-sm cursor-pointer transition-all group bg-white dark:bg-[#242325]"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                                    <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-[#635BFF] transition-colors">
                                                        {note.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        {format(parseDate(note.updatedAt), 'MMM d, yyyy')}
                                                    </p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#635BFF] transition-colors flex-shrink-0" />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}
