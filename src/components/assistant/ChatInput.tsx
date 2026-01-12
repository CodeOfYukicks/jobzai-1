import React, { useState, useRef, useEffect, KeyboardEvent, useCallback } from 'react';
import { Send, Square, AtSign, Globe, Pencil, X, Loader2, Clock, Briefcase, FileText, BarChart3, Calendar, UserCircle, LayoutDashboard, StickyNote, Palette, FileIcon, Settings, CreditCard, Mic, User, FileSearch, Lightbulb, Send as SendIcon, Sparkles, Brain, Zap, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAssistant } from '../../contexts/AssistantContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, updateDoc, getDoc, collection, getDocs, limit, query, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { recordCreditHistory } from '../../lib/creditHistory';
import { notify } from '../../lib/notify';
import { markdownToTiptap, cleanAIMarkdown } from '../../lib/markdownToTiptap';
import {
  parseWhiteboardIntent,
  isWhiteboardCreationRequest,
  parseMindMapResponse,
  parseStickyNotesResponse,
  parseFlowDiagramResponse,
  generateFallbackMindMap,
  generateFallbackStickyNotes,
  generateFallbackFlowDiagram,
} from '../../lib/whiteboardAI';
import {
  globalSearch,
  GlobalSearchResult,
  SearchResultType,
  getTypeLabel,
  getTypeColor,
  fetchJobApplications,
  fetchResumes,
  fetchCVAnalyses,
  fetchInterviews,
  fetchCampaignContacts,
  fetchNotes,
  fetchWhiteboards,
  fetchDocuments,
} from '../../lib/globalSearchService';
import { PersonaConfig, DEFAULT_PERSONA_CONFIG, loadPersonaConfig, generatePersonaPrompt } from './avatar/personaConfig';

interface ChatInputProps {
  placeholder?: string;
}

// Selected context item with actual data
interface SelectedContextItem {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  path?: string;
  data?: Record<string, any>; // Actual data fetched from Firebase
}

const CREDIT_COST = 1;
const SEARCH_DEBOUNCE_MS = 200;

// AI Provider types
type AIProvider = 'openai' | 'anthropic' | 'gemini';

interface AIProviderOption {
  id: AIProvider;
  name: string;
  model: string;
  icon: React.ReactNode;
  color: string;
}

// Icon mapping for context items
const getContextIcon = (type: SearchResultType, iconName?: string) => {
  const iconClass = "h-3.5 w-3.5";

  switch (iconName || type) {
    case 'briefcase':
    case 'job-application':
      return <Briefcase className={iconClass} />;
    case 'file-text':
    case 'resume':
      return <FileText className={iconClass} />;
    case 'bar-chart-3':
    case 'cv-analysis':
      return <BarChart3 className={iconClass} />;
    case 'calendar':
    case 'interview':
      return <Calendar className={iconClass} />;
    case 'user-circle':
    case 'campaign':
      return <UserCircle className={iconClass} />;
    case 'layout-dashboard':
    case 'page':
      return <LayoutDashboard className={iconClass} />;
    case 'sticky-note':
    case 'note':
      return <StickyNote className={iconClass} />;
    case 'palette':
    case 'whiteboard':
      return <Palette className={iconClass} />;
    case 'file-pdf':
    case 'document':
      return <FileIcon className={iconClass} />;
    case 'settings':
      return <Settings className={iconClass} />;
    case 'credit-card':
      return <CreditCard className={iconClass} />;
    case 'mic':
      return <Mic className={iconClass} />;
    case 'user':
      return <User className={iconClass} />;
    case 'file-search':
      return <FileSearch className={iconClass} />;
    case 'send':
      return <SendIcon className={iconClass} />;
    default:
      return <FileText className={iconClass} />;
  }
};

// Get color for result type
const getContextColor = (type: SearchResultType): string => {
  switch (type) {
    case 'job-application': return '#3B82F6'; // blue
    case 'resume': return '#10B981'; // emerald
    case 'cv-analysis': return '#8B5CF6'; // purple
    case 'interview': return '#F59E0B'; // amber
    case 'campaign': return '#EC4899'; // pink
    case 'note': return '#EAB308'; // yellow
    case 'whiteboard': return '#06B6D4'; // cyan
    case 'document': return '#EF4444'; // red
    case 'page': return '#6B7280'; // gray
    default: return '#6B7280';
  }
};

export default function ChatInput({ placeholder = 'Ask, search, or make anything...' }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [selectedContexts, setSelectedContexts] = useState<SelectedContextItem[]>([]);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextSearch, setContextSearch] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAISelector, setShowAISelector] = useState(false);
  const [selectedAIProvider, setSelectedAIProvider] = useState<AIProvider>('openai');
  const [isLoadingAIPreference, setIsLoadingAIPreference] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const aiSelectorRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const {
    addMessage,
    updateMessage,
    isLoading,
    setIsLoading,
    currentPageContext,
    pendingMessage,
    setPendingMessage,
    pageData,
    messages, // Get conversation history
    // Inline AI editing
    noteEditorCallbacks,
    startInlineEdit,
    streamInlineChunk,
    setInlinePendingContent,
    finishInlineStreaming,
    // Real-time editor selection
    editorSelection,
    // Whiteboard integration
    whiteboardEditorCallbacks,
  } = useAssistant();

  const { currentUser, userData } = useAuth();
  const { profile } = useUserProfile();

  // Persona config for customizing AI personality
  const [personaConfig, setPersonaConfig] = useState<PersonaConfig>(DEFAULT_PERSONA_CONFIG);

  // Load persona config on mount
  useEffect(() => {
    const loadUserPersona = async () => {
      if (currentUser?.uid) {
        try {
          const config = await loadPersonaConfig(currentUser.uid);
          setPersonaConfig(config);
        } catch (error) {
          console.error('[ChatInput] Error loading persona config:', error);
        }
      }
    };
    loadUserPersona();
  }, [currentUser?.uid]);

  // AI Provider options with company logos - OFFICIAL model names
  const aiProviders: AIProviderOption[] = [
    {
      id: 'openai',
      name: 'GPT-5.2',
      model: 'gpt-5.2',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
        </svg>
      ),
      color: '#10a37f'
    },
    {
      id: 'anthropic',
      name: 'Claude Sonnet 4.5',
      model: 'claude-sonnet-4-5',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.2 2L22 21.7h-4.6l-1-3.6h-5.5l-1 3.6H5.3L10 2h7.2zm-1.3 5.3l-1.9 7.1h3.9l-2-7.1z" />
        </svg>
      ),
      color: '#d97757'
    },
    {
      id: 'gemini',
      name: 'Gemini 3 Pro',
      model: 'gemini-3-pro',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
      color: '#4285f4'
    }
  ];

  // Load AI preference from Firestore
  useEffect(() => {
    const loadAIPreference = async () => {
      if (!currentUser) {
        setIsLoadingAIPreference(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists() && userDoc.data()?.assistantAIProvider) {
          setSelectedAIProvider(userDoc.data().assistantAIProvider as AIProvider);
        }
      } catch (error) {
        console.error('Error loading AI preference:', error);
        // Silently fail and use default
      } finally {
        setIsLoadingAIPreference(false);
      }
    };

    loadAIPreference();
  }, [currentUser]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
        setContextSearch('');
        setSearchResults([]);
        setSelectedIndex(0);
      }
      if (aiSelectorRef.current && !aiSelectorRef.current.contains(event.target as Node)) {
        setShowAISelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for context items when query changes
  useEffect(() => {
    console.log('📎 Search effect triggered:', { showContextMenu, hasUser: !!currentUser, contextSearch });

    if (!showContextMenu || !currentUser) {
      console.log('📎 Search skipped - menu not open or no user');
      return;
    }

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce search
    debounceRef.current = setTimeout(async () => {
      console.log('📎 Starting search with query:', contextSearch || '(empty)');
      setIsSearching(true);
      try {
        const results = await globalSearch(currentUser.uid, {
          query: contextSearch || undefined,
          limit: 15,
        });
        console.log('📎 Search results:', results.length, 'items found', results.map(r => `${r.type}:${r.title}`));
        // Filter out already selected items
        const filteredResults = results.filter(
          r => !selectedContexts.find(ctx => ctx.id === r.id && ctx.type === r.type)
        );
        console.log('📎 Filtered results:', filteredResults.length, 'items');
        setSearchResults(filteredResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error('📎 Error searching:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [contextSearch, showContextMenu, currentUser, selectedContexts]);

  // Focus search input when menu opens
  useEffect(() => {
    if (showContextMenu && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [showContextMenu]);

  // Fetch actual data for a search result
  const fetchContextData = async (result: GlobalSearchResult): Promise<Record<string, any> | undefined> => {
    if (!currentUser) return undefined;

    try {
      switch (result.type) {
        case 'job-application': {
          const docRef = doc(db, 'users', currentUser.uid, 'jobApplications', result.id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            return { ...docSnap.data(), id: docSnap.id };
          }
          break;
        }
        case 'resume': {
          const docRef = doc(db, 'users', currentUser.uid, 'cvs', result.id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            return { ...docSnap.data(), id: docSnap.id };
          }
          break;
        }
        case 'cv-analysis': {
          const docRef = doc(db, 'users', currentUser.uid, 'analyses', result.id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            return { ...docSnap.data(), id: docSnap.id };
          }
          break;
        }
        case 'interview': {
          // Interviews are nested in job applications
          const appId = result.extra?.applicationId;
          if (appId) {
            const docRef = doc(db, 'users', currentUser.uid, 'jobApplications', appId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const appData = docSnap.data();
              const interview = appData.interviews?.find((i: any) => i.id === result.id);
              if (interview) {
                return {
                  ...interview,
                  companyName: appData.companyName,
                  position: appData.position,
                  applicationId: appId,
                };
              }
            }
          }
          break;
        }
        case 'campaign': {
          const docRef = doc(db, 'users', currentUser.uid, 'jobApplications', result.id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            return { ...docSnap.data(), id: docSnap.id };
          }
          break;
        }
        case 'note': {
          const docRef = doc(db, 'users', currentUser.uid, 'notes', result.id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            return { ...docSnap.data(), id: docSnap.id };
          }
          break;
        }
        case 'whiteboard': {
          const docRef = doc(db, 'users', currentUser.uid, 'whiteboards', result.id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            return { ...docSnap.data(), id: docSnap.id };
          }
          break;
        }
        case 'document': {
          const docRef = doc(db, 'users', currentUser.uid, 'documents', result.id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            return { ...docSnap.data(), id: docSnap.id };
          }
          break;
        }
        case 'page':
          // Pages don't have extra data, just return basic info
          return {
            pageName: result.title,
            pageDescription: result.subtitle,
            path: result.path,
          };
      }
    } catch (error) {
      console.error(`Error fetching data for ${result.type}:`, error);
    }
    return undefined;
  };

  // Add context to selection
  const addContext = async (result: GlobalSearchResult) => {
    console.log('📎 Adding context:', result.type, result.title, result.id);

    // Fetch actual data for the selected item
    const data = await fetchContextData(result);
    console.log('📎 Fetched data for context:', data ? 'Success' : 'No data', data);

    const contextItem: SelectedContextItem = {
      id: result.id,
      type: result.type,
      title: result.title,
      subtitle: result.subtitle,
      path: result.path,
      data,
    };

    setSelectedContexts(prev => [...prev, contextItem]);
    setShowContextMenu(false);
    setContextSearch('');
    setSearchResults([]);
    setSelectedIndex(0);
    textareaRef.current?.focus();
  };

  // Remove context from selection
  const removeContext = (contextId: string, contextType: SearchResultType) => {
    setSelectedContexts(prev => prev.filter(ctx => !(ctx.id === contextId && ctx.type === contextType)));
  };

  // Save AI preference to Firestore
  const saveAIPreference = async (provider: AIProvider) => {
    if (!currentUser) return;

    try {
      const providerName = aiProviders.find(p => p.id === provider)?.name;
      console.log(`🤖 [AI SELECTOR] User selected: ${providerName} (${provider})`);

      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { assistantAIProvider: provider });
      setSelectedAIProvider(provider);
      setShowAISelector(false);

      console.log(`✅ [AI SELECTOR] Preference saved to Firestore: ${provider}`);
      notify.success(`Switched to ${providerName}`);
    } catch (error) {
      console.error('❌ [AI SELECTOR] Error saving AI preference:', error);
      notify.error('Failed to save AI preference');
    }
  };

  // Handle keyboard navigation in search results
  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && searchResults[selectedIndex]) {
      e.preventDefault();
      addContext(searchResults[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowContextMenu(false);
      setContextSearch('');
      setSearchResults([]);
      textareaRef.current?.focus();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Helper to detect if message is requesting a note edit
  const isNoteEditRequest = useCallback((message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    const editKeywords = [
      'rewrite', 'reécrire', 'réécrire', 'réécris',
      'summarize', 'summary', 'résume', 'résumer',
      'improve', 'améliore', 'améliorer',
      'update', 'mettre à jour', 'mets à jour',
      'edit', 'édite', 'éditer', 'modifier',
      'expand', 'développe', 'développer',
      'shorten', 'raccourcis', 'raccourcir',
      'reformat', 'reformate', 'reformater',
      'restructure', 'restructure', 'restructurer',
      'make it', 'rends', 'rend',
      'change', 'change', 'changer',
      'fix', 'corrige', 'corriger',
      'add', 'ajoute', 'ajouter',
      'write', 'écris', 'écrire',
      'create a table', 'créer un tableau',
      'bullet points', 'liste à puces',
      'format', 'formate', 'formater',
    ];

    return editKeywords.some(keyword => lowerMessage.includes(keyword));
  }, []);

  // Check if we're on a notes page
  const isOnNotesPage = location.pathname.startsWith('/notes/');

  // Check if we're on a whiteboard page
  const isOnWhiteboardPage = location.pathname.startsWith('/whiteboard/');

  // Process and send a message
  const processSendMessage = useCallback(async (messageContent: string) => {
    const trimmedInput = messageContent.trim();
    if (!trimmedInput || isLoading) return;

    // Use the real-time editor selection from context (tracked as user selects text)
    const hasSelection = editorSelection && editorSelection.text.trim().length > 0;

    // Check if this should be an inline edit:
    // - On notes page + editor available
    // - AND either: has a selection (any message on selection = edit request) OR explicit edit request
    const shouldDoInlineEdit = isOnNotesPage && noteEditorCallbacks && (hasSelection || isNoteEditRequest(trimmedInput));

    // Determine edit type: 'selection' if user has selected text, otherwise 'full'
    const editType = hasSelection ? 'selection' : 'full';

    // Check if user has enough credits
    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        const currentCredits = userDoc.data()?.credits ?? 0;
        const isPremium = userDoc.data()?.plan === 'premium';

        // Premium users have unlimited credits
        if (!isPremium && currentCredits < CREDIT_COST) {
          notify.error('Not enough credits. Please upgrade your plan.');
          return;
        }
      } catch (error) {
        console.error('Error checking credits:', error);
        // Continue anyway - don't block the user
      }
    }

    // Clear input
    setInput('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Add user message
    addMessage({
      role: 'user',
      content: trimmedInput,
    });

    // If inline edit, start the inline edit mode
    if (shouldDoInlineEdit) {
      startInlineEdit(editType);

      // Add a brief status message to chat (uses marker format for premium animation)
      const statusMessage = hasSelection
        ? '[AI_UPDATING:selection]'
        : '[AI_UPDATING:note]';
      const assistantMessageId = addMessage({
        role: 'assistant',
        content: statusMessage,
        isStreaming: true,
      });

      setIsLoading(true);

      try {
        // Build the API request for inline editing
        const userContext = {
          firstName: profile?.firstName || userData?.name?.split(' ')[0] || 'User',
          email: profile?.email || currentUser?.email,
        };

        // Get current note content for context
        const currentNoteContent = pageData?.currentNote?.content || '';

        // Build the message with selection context if available
        let enhancedMessage = trimmedInput;
        if (hasSelection && editorSelection) {
          enhancedMessage = `[SELECTED TEXT TO EDIT: "${editorSelection.text}"]\n\nUser request: ${trimmedInput}`;
        }

        // Generate persona prompt for inline edits too
        const personaPrompt = generatePersonaPrompt(personaConfig);

        const response = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: enhancedMessage,
            aiProvider: selectedAIProvider,
            pageContext: {
              pathname: location.pathname,
              pageName: currentPageContext?.pageName,
              pageDescription: currentPageContext?.pageDescription,
            },
            userContext,
            userId: currentUser?.uid,
            pageData: { currentNote: pageData?.currentNote },
            inlineEditMode: true, // Signal to server this is an inline edit
            selectionMode: hasSelection, // Signal selection-based edit
            selectedText: hasSelection ? editorSelection?.text : undefined,
            personaConfig: personaConfig, // Include persona customization
            personaPrompt: personaPrompt, // Pre-generated persona prompt
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        // Stream response to editor
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('text/event-stream')) {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let fullContent = '';
          let buffer = '';
          let errorMessage = '';

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('data: ')) {
                  const data = trimmedLine.slice(6);
                  if (data === '[DONE]') continue;
                  try {
                    const parsed = JSON.parse(data);
                    // Check for error messages from the server
                    if (parsed.error) {
                      errorMessage = parsed.error;
                      console.error('❌ [INLINE EDIT] Error:', parsed.error);
                    } else if (parsed.content) {
                      fullContent += parsed.content;
                      // Stream to editor
                      streamInlineChunk(parsed.content);
                    }
                  } catch {
                    // Skip invalid JSON
                  }
                }
              }
            }
          }

          // Finish streaming and set pending content
          finishInlineStreaming();

          // Handle error case
          if (errorMessage) {
            updateMessage(assistantMessageId, `⚠️ Error: ${errorMessage}`, false);
            return;
          }

          // Handle content based on edit type
          // Clean up AI artifacts from the content
          const cleanedContent = cleanAIMarkdown(fullContent);

          if (hasSelection && editorSelection && noteEditorCallbacks?.replaceSelection) {
            // For selection mode, we'll replace just the selection
            // Parse the content to TipTap format even for selection
            const parsedContent = markdownToTiptap(cleanedContent);
            setInlinePendingContent({
              type: 'selection-replace',
              content: parsedContent,
              text: cleanedContent, // Keep raw text as fallback
              range: { from: editorSelection.from, to: editorSelection.to },
            });
          } else {
            // For full document edit, parse markdown into TipTap JSON format
            const pendingContent = markdownToTiptap(cleanedContent);
            setInlinePendingContent(pendingContent);
          }

          // Update chat message
          const confirmMessage = hasSelection
            ? '✨ Review the changes to your selected text and accept or discard them.'
            : '✨ Review the changes in your note and accept or discard them.';
          updateMessage(assistantMessageId, confirmMessage, false);
        }
      } catch (error) {
        console.error('Error in inline edit:', error);
        updateMessage(assistantMessageId, 'Sorry, I encountered an error. Please try again.', false);
        finishInlineStreaming();
      } finally {
        setIsLoading(false);
      }

      return; // Exit early for inline edit
    }

    // Check if this is a whiteboard creation request
    const shouldDoWhiteboardEdit = isOnWhiteboardPage && whiteboardEditorCallbacks && isWhiteboardCreationRequest(trimmedInput);

    if (shouldDoWhiteboardEdit) {
      // Handle whiteboard content creation
      const intent = parseWhiteboardIntent(trimmedInput);

      // Use marker format for premium animation (mind_map, sticky_notes, flow_diagram)
      const assistantMessageId = addMessage({
        role: 'assistant',
        content: `[AI_UPDATING:${intent.type}]`,
        isStreaming: true,
      });

      setIsLoading(true);

      try {
        // Build user context
        const userContext = {
          firstName: profile?.firstName || userData?.name?.split(' ')[0] || 'User',
          skills: profile?.skills,
          currentJobTitle: profile?.currentJobTitle,
        };

        // Include selected context items with their actual data
        const contextItems = selectedContexts.map(ctx => ({
          id: ctx.id,
          type: ctx.type,
          title: ctx.title,
          subtitle: ctx.subtitle,
          path: ctx.path,
          data: ctx.data,
        }));

        // Call API with whiteboard mode
        const response = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmedInput,
            aiProvider: selectedAIProvider,
            pageContext: {
              pathname: location.pathname,
              pageName: currentPageContext?.pageName,
              pageDescription: currentPageContext?.pageDescription,
            },
            selectedContextItems: contextItems,
            userContext,
            userId: currentUser?.uid,
            pageData: pageData,
            whiteboardMode: true,
            whiteboardIntent: intent,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        // Get the full response
        const contentType = response.headers.get('content-type');
        let aiResponse = '';

        if (contentType?.includes('text/event-stream')) {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('data: ')) {
                  const data = trimmedLine.slice(6);
                  if (data === '[DONE]') continue;
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.content) {
                      aiResponse += parsed.content;
                    }
                  } catch {
                    // Skip invalid JSON
                  }
                }
              }
            }
          }
        } else {
          const jsonResponse = await response.json();
          aiResponse = jsonResponse.content || jsonResponse.text || '';
        }

        // Log AI response for debugging
        console.log('[WHITEBOARD] AI Response length:', aiResponse.length);
        console.log('[WHITEBOARD] AI Response preview:', aiResponse.substring(0, 500));
        console.log('[WHITEBOARD] Intent:', intent.type, 'Topic:', intent.extractedTopic);
        console.log('[WHITEBOARD] Context items:', contextItems.length, contextItems.map(c => `${c.type}:${c.title}`));

        // Parse the AI response and create shapes on the whiteboard
        let createdShapeIds: string[] = [];
        let successMessage = '';
        let usedFallback = false;

        switch (intent.type) {
          case 'mind_map': {
            const parsed = parseMindMapResponse(aiResponse);
            const mindMapStructure = parsed || generateFallbackMindMap(intent.extractedTopic || 'Ideas');
            usedFallback = !parsed;
            if (usedFallback) {
              console.warn('[WHITEBOARD] Using fallback mind map - AI response parsing failed');
            }
            createdShapeIds = await whiteboardEditorCallbacks.createMindMap(mindMapStructure);
            successMessage = usedFallback
              ? `⚠️ Created basic mind map (AI parsing failed). Try being more specific in your request.`
              : `✅ Created mind map "${mindMapStructure.centerTopic}" with ${mindMapStructure.branches.length} branches!`;
            break;
          }
          case 'sticky_notes': {
            const parsed = parseStickyNotesResponse(aiResponse);
            const stickyNotes = parsed || generateFallbackStickyNotes(intent.extractedTopic || 'Ideas', intent.extractedCount || 5);
            usedFallback = !parsed;
            if (usedFallback) {
              console.warn('[WHITEBOARD] Using fallback sticky notes - AI response parsing failed');
            }
            // Convert to format expected by the callback
            const notes = stickyNotes.map(note => ({ text: note.text, color: note.color }));
            for (const note of notes) {
              const id = await whiteboardEditorCallbacks.addStickyNote(note.text, note.color);
              createdShapeIds.push(id);
            }
            whiteboardEditorCallbacks.zoomToFit();
            successMessage = usedFallback
              ? `⚠️ Created ${notes.length} placeholder notes (AI parsing failed). Try again.`
              : `✅ Created ${notes.length} sticky notes!`;
            break;
          }
          case 'flow_diagram': {
            const parsed = parseFlowDiagramResponse(aiResponse);
            const flowDiagram = parsed || generateFallbackFlowDiagram(intent.extractedTopic || 'Process');
            usedFallback = !parsed;
            if (usedFallback) {
              console.warn('[WHITEBOARD] Using fallback flow diagram - AI response parsing failed');
            }
            createdShapeIds = await whiteboardEditorCallbacks.createFlowDiagram(flowDiagram.nodes, flowDiagram.connections);
            successMessage = usedFallback
              ? `⚠️ Created basic flow diagram (AI parsing failed). Try being more specific.`
              : `✅ Created flow diagram with ${flowDiagram.nodes.length} steps!`;
            break;
          }
          case 'text': {
            const textId = await whiteboardEditorCallbacks.addTextBox(intent.extractedTopic || trimmedInput);
            createdShapeIds.push(textId);
            successMessage = `✅ Added text to the whiteboard!`;
            break;
          }
          case 'frame': {
            const frameId = await whiteboardEditorCallbacks.addFrame(intent.extractedTopic || 'New Section');
            createdShapeIds.push(frameId);
            successMessage = `✅ Created frame "${intent.extractedTopic || 'New Section'}"!`;
            break;
          }
          default: {
            // Default: create sticky notes for brainstorm
            const parsed = parseStickyNotesResponse(aiResponse);
            const defaultNotes = parsed || generateFallbackStickyNotes(intent.extractedTopic || 'Ideas', 5);
            usedFallback = !parsed;
            for (const note of defaultNotes) {
              const id = await whiteboardEditorCallbacks.addStickyNote(note.text, note.color);
              createdShapeIds.push(id);
            }
            whiteboardEditorCallbacks.zoomToFit();
            successMessage = usedFallback
              ? `⚠️ Created ${defaultNotes.length} placeholder ideas (AI parsing failed).`
              : `✅ Created ${defaultNotes.length} ideas on the whiteboard!`;
            break;
          }
        }

        updateMessage(assistantMessageId, successMessage, false);

      } catch (error) {
        console.error('Error in whiteboard creation:', error);
        updateMessage(assistantMessageId, '❌ Sorry, I encountered an error creating content on the whiteboard. Please try again.', false);
      } finally {
        setIsLoading(false);
      }

      return; // Exit early for whiteboard edit
    }

    // Regular chat flow (non-inline edit)
    // Add placeholder for assistant response
    const assistantMessageId = addMessage({
      role: 'assistant',
      content: '',
      isStreaming: true,
    });

    setIsLoading(true);

    try {
      // Deduct credit before making API call
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);
          const currentCredits = userDoc.data()?.credits ?? 0;
          const isPremium = userDoc.data()?.plan === 'premium';

          // Only deduct for non-premium users
          if (!isPremium && currentCredits > 0) {
            const newCredits = currentCredits - CREDIT_COST;
            await updateDoc(userRef, { credits: newCredits });
            await recordCreditHistory(
              currentUser.uid,
              newCredits,
              -CREDIT_COST,
              'assistant',
              `assistant_${Date.now()}`
            );
          }
        } catch (error) {
          console.error('Error deducting credits:', error);
          // Continue anyway - credit deduction failure shouldn't block the user
        }
      }

      // Build user context for the API - Enriched with full professional profile
      const userContext = {
        firstName: profile?.firstName || userData?.name?.split(' ')[0] || 'User',
        lastName: profile?.lastName,
        email: profile?.email || currentUser?.email,
        currentJobTitle: profile?.currentJobTitle,
        currentCompany: profile?.currentCompany,
        industry: profile?.industry,
        skills: profile?.skills,
        yearsOfExperience: profile?.yearsOfExperience,
        // Professional summary and CV data
        professionalSummary: profile?.professionalSummary,
        cvText: profile?.cvText,
        cvTechnologies: profile?.cvTechnologies,
        cvSkills: profile?.cvSkills,
        // Work experience and education
        workExperience: profile?.workExperience,
        education: profile?.education,
        // Languages and certifications
        languages: profile?.languages,
        certifications: profile?.certifications,
        // Career preferences (if available from userData)
        targetPosition: (userData as any)?.targetPosition,
        targetSectors: (userData as any)?.targetSectors,
        // Additional professional info
        location: profile?.location,
        linkedinUrl: profile?.linkedinUrl,
        githubUrl: profile?.githubUrl,
        portfolioUrl: profile?.portfolioUrl,
      };

      // Build conversation history for context (last 10 messages to avoid token limits)
      const conversationHistory = messages
        .slice(-10) // Keep last 10 messages for context
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

      // Include selected context items with their actual data
      const contextItems = selectedContexts.map(ctx => ({
        id: ctx.id,
        type: ctx.type,
        title: ctx.title,
        subtitle: ctx.subtitle,
        path: ctx.path,
        data: ctx.data, // Include actual data from Firebase
      }));

      // Debug: log context items being sent
      console.log('📎 Sending context items to API:', contextItems);

      // Debug: log userContext being sent
      console.log('👤 ════════════════════════════════════════════════════════');
      console.log('👤 [USER CONTEXT] Profile object:', profile);
      console.log('👤 [USER CONTEXT] UserData object:', userData);
      console.log('👤 [USER CONTEXT] Sending to API:', userContext);
      console.log('👤 ════════════════════════════════════════════════════════');

      const providerInfo = aiProviders.find(p => p.id === selectedAIProvider);
      console.log('🤖 ════════════════════════════════════════════════════════');

      console.log('🤖 [REQUEST] Using AI Provider:', providerInfo?.name);
      console.log('🤖 [REQUEST] Provider ID:', selectedAIProvider);
      console.log('🤖 [REQUEST] Model:', providerInfo?.model);
      console.log('🤖 [REQUEST] Message:', trimmedInput.substring(0, 50) + '...');
      console.log('🤖 ════════════════════════════════════════════════════════');

      // Generate persona prompt addition for AI personality customization
      const personaPrompt = generatePersonaPrompt(personaConfig);

      // Determine API URL - Use direct function URL in production to avoid Firebase Hosting buffering
      const apiUrl = import.meta.env.PROD
        ? 'https://assistant-pyozgz4rbq-uc.a.run.app'
        : '/api/assistant';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmedInput,
          aiProvider: selectedAIProvider, // Include selected AI provider
          conversationHistory, // Include conversation history
          pageContext: {
            pathname: location.pathname,
            pageName: currentPageContext?.pageName,
            pageDescription: currentPageContext?.pageDescription,
          },
          selectedContextItems: contextItems, // Include user-selected context items with data
          userContext,
          userId: currentUser?.uid,
          pageData: pageData,
          personaConfig: personaConfig, // Include persona customization
          personaPrompt: personaPrompt, // Pre-generated persona prompt
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to get response');
      }

      // Check if response is streaming (SSE)
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('text/event-stream')) {
        // Handle streaming response with proper buffer handling
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let buffer = '';
        let errorMessage = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Add new chunk to buffer
            buffer += decoder.decode(value, { stream: true });

            // Process complete lines from buffer
            const lines = buffer.split('\n');
            // Keep the last incomplete line in the buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('data: ')) {
                const data = trimmedLine.slice(6);
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  // Check for error messages from the server
                  if (parsed.error) {
                    errorMessage = parsed.error;
                    console.error(`❌ [RESPONSE] Error from ${providerInfo?.name}:`, parsed.error);
                  } else if (parsed.content) {
                    fullContent += parsed.content;
                    // Update message with each chunk for smooth streaming effect
                    updateMessage(assistantMessageId, fullContent, true);
                  }
                } catch {
                  // Skip invalid JSON chunks
                }
              }
            }
          }
        }

        // Mark streaming as complete
        if (errorMessage) {
          console.error(`❌ [RESPONSE] Error from ${providerInfo?.name}: ${errorMessage}`);
          updateMessage(assistantMessageId, `⚠️ Error: ${errorMessage}`, false);
        } else {
          console.log(`✅ [RESPONSE] Received ${fullContent.length} characters from ${providerInfo?.name}`);
          updateMessage(assistantMessageId, fullContent || 'No response received', false);
        }
      } else {
        // Handle JSON response (fallback)
        const data = await response.json();
        updateMessage(assistantMessageId, data.content || data.message || 'No response received', false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      updateMessage(
        assistantMessageId,
        'Sorry, I encountered an error. Please try again.',
        false
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, currentUser, addMessage, setIsLoading, profile, userData, location.pathname, currentPageContext, updateMessage, pageData, messages, selectedContexts, isOnNotesPage, noteEditorCallbacks, isNoteEditRequest, startInlineEdit, streamInlineChunk, finishInlineStreaming, setInlinePendingContent, selectedAIProvider, editorSelection]);

  // Handle pending messages from QuickActions
  useEffect(() => {
    if (pendingMessage && !isLoading) {
      setPendingMessage(null);
      processSendMessage(pendingMessage);
    }
  }, [pendingMessage, isLoading, setPendingMessage, processSendMessage]);

  const sendMessage = () => {
    processSendMessage(input);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    // Handle @ key to open context menu
    if (e.key === '@') {
      e.preventDefault();
      setShowContextMenu(true);
    }
  };

  // Stop generation
  const handleStop = () => {
    setIsLoading(false);
  };

  return (
    <div className="relative">
      {/* Main input container */}
      <div className="relative bg-white dark:bg-[#1c1c1e] 
        rounded-2xl border border-gray-200/80 dark:border-white/[0.08]
        shadow-sm
        focus-within:border-[#635BFF]/50 dark:focus-within:border-[#635BFF]/40
        focus-within:shadow-[0_0_0_3px_rgba(99,91,255,0.1)]
        transition-all duration-200">

        {/* Top section: Context pills + Input */}
        <div className="px-4 pt-3.5 pb-2">
          {/* Context pills row */}
          <div className="flex items-center flex-wrap gap-2 mb-2 min-h-[28px]">
            {/* @ Button to add context */}
            <div className="relative" ref={contextMenuRef}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowContextMenu(!showContextMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                  bg-gray-100 dark:bg-white/[0.06] 
                  hover:bg-gray-200 dark:hover:bg-white/[0.1]
                  text-gray-600 dark:text-gray-400
                  transition-colors duration-150 text-sm font-medium"
              >
                <AtSign className="h-3.5 w-3.5" />
              </motion.button>

              {/* Context selection dropdown */}
              <AnimatePresence>
                {showContextMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 mb-2 w-80 
                      bg-white dark:bg-[#2a2a2c] 
                      rounded-xl border border-gray-200 dark:border-white/[0.08]
                      shadow-lg shadow-black/10 dark:shadow-black/30
                      overflow-hidden z-50"
                  >
                    {/* Search input */}
                    <div className="p-2 border-b border-gray-100 dark:border-white/[0.06]">
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={contextSearch}
                        onChange={(e) => setContextSearch(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="Search pages..."
                        className="w-full px-3 py-2 rounded-lg
                          bg-gray-50 dark:bg-white/[0.04]
                          border border-gray-200 dark:border-white/[0.06]
                          text-sm text-gray-900 dark:text-white
                          placeholder:text-gray-400 dark:placeholder:text-gray-500
                          focus:outline-none focus:border-[#635BFF]/50"
                      />
                    </div>

                    {/* Search results */}
                    <div className="max-h-72 overflow-y-auto p-1.5">
                      {isSearching ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        </div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((result, index) => {
                          const color = getContextColor(result.type);
                          const isSelected = index === selectedIndex;
                          return (
                            <button
                              key={`${result.type}-${result.id}`}
                              onClick={() => addContext(result)}
                              onMouseEnter={() => setSelectedIndex(index)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                                transition-colors duration-150 text-left
                                ${isSelected
                                  ? 'bg-[#635BFF]/10 dark:bg-[#635BFF]/20'
                                  : 'hover:bg-gray-100 dark:hover:bg-white/[0.06]'
                                }`}
                            >
                              <div
                                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors
                                  ${isSelected ? 'bg-[#635BFF] text-white' : ''}`}
                                style={!isSelected ? { backgroundColor: `${color}15`, color } : {}}
                              >
                                {getContextIcon(result.type, result.icon)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-medium truncate
                                    ${isSelected ? 'text-[#635BFF] dark:text-[#a5a0ff]' : 'text-gray-900 dark:text-white'}`}>
                                    {result.title}
                                  </span>
                                  {result.status && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                      {result.status.replace(/_/g, ' ')}
                                    </span>
                                  )}
                                  {result.score !== undefined && (
                                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded
                                      ${result.score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : result.score >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                      {result.score}%
                                    </span>
                                  )}
                                </div>
                                {result.subtitle && (
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      {result.subtitle}
                                    </span>
                                    {result.date && (
                                      <>
                                        <span className="text-gray-300 dark:text-gray-600">·</span>
                                        <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                          <Clock className="w-3 h-3" />
                                          {result.date}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                              <span className={`text-[10px] font-medium uppercase tracking-wide flex-shrink-0
                                ${isSelected ? 'text-[#635BFF] dark:text-[#a5a0ff]' : 'text-gray-400 dark:text-gray-500'}`}>
                                {getTypeLabel(result.type)}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="py-8 text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {contextSearch ? 'No results found' : 'Start typing to search...'}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Search applications, resumes, notes, and more
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer hint */}
                    <div className="px-3 py-2 border-t border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-[#242325]/50">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        <span className="font-medium">↑↓</span> navigate · <span className="font-medium">↵</span> select · <span className="font-medium">esc</span> close
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Selected context pills */}
            <AnimatePresence mode="popLayout">
              {selectedContexts.map((context) => {
                const color = getContextColor(context.type);
                return (
                  <motion.div
                    key={`${context.type}-${context.id}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-lg
                      bg-gray-100 dark:bg-white/[0.06] 
                      border border-gray-200/50 dark:border-white/[0.04]
                      group max-w-[200px]"
                  >
                    <span style={{ color }}>{getContextIcon(context.type)}</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {context.title}
                    </span>
                    <button
                      onClick={() => removeContext(context.id, context.type)}
                      className="ml-0.5 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-white/[0.1]
                        text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
                        transition-colors duration-150 flex-shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className="w-full bg-transparent resize-none
              text-[15px] text-gray-900 dark:text-white
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              focus:outline-none
              disabled:opacity-50 disabled:cursor-not-allowed
              max-h-[120px] min-h-[40px]"
          />
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 
          border-t border-gray-100 dark:border-white/[0.04]">

          {/* Left side: Mode selectors */}
          <div className="flex items-center gap-3">
            {/* AI Selector */}
            <div className="relative" ref={aiSelectorRef}>
              <button
                onClick={() => setShowAISelector(!showAISelector)}
                disabled={isLoadingAIPreference}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md
                  text-gray-500 dark:text-gray-400 
                  hover:text-gray-700 dark:hover:text-gray-300
                  hover:bg-gray-100 dark:hover:bg-white/[0.04]
                  transition-colors duration-150 text-sm disabled:opacity-50">
                {isLoadingAIPreference ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  React.cloneElement(aiProviders.find(p => p.id === selectedAIProvider)?.icon as React.ReactElement, {
                    className: "h-3.5 w-3.5"
                  })
                )}
                <span className="font-medium">
                  {aiProviders.find(p => p.id === selectedAIProvider)?.name || 'Auto'}
                </span>
              </button>

              {/* AI Selector Modal */}
              <AnimatePresence>
                {showAISelector && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 mb-2 w-64
                      bg-white dark:bg-[#2a2a2c] 
                      rounded-xl border border-gray-200 dark:border-white/[0.08]
                      shadow-lg shadow-black/10 dark:shadow-black/30
                      overflow-hidden z-50"
                  >
                    <div className="p-2.5 border-b border-gray-100 dark:border-white/[0.06]">
                      <h3 className="text-xs font-semibold text-gray-900 dark:text-white">
                        Select AI Model
                      </h3>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Choose which AI to use for your queries
                      </p>
                    </div>

                    <div className="p-1.5">
                      {aiProviders.map((provider) => {
                        const isSelected = selectedAIProvider === provider.id;
                        return (
                          <button
                            key={provider.id}
                            onClick={() => saveAIPreference(provider.id)}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg
                              transition-all duration-150 text-left
                              ${isSelected
                                ? 'bg-gray-100 dark:bg-white/[0.08] ring-2 ring-gray-900 dark:ring-white/20'
                                : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                              }`}
                          >
                            <div
                              className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                              style={{ backgroundColor: `${provider.color}15`, color: provider.color }}
                            >
                              {provider.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                  {provider.name}
                                </span>
                                {provider.id === 'openai' && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 uppercase flex-shrink-0">
                                    NEW
                                  </span>
                                )}
                                {isSelected && (
                                  <Check className="h-3 w-3 text-gray-900 dark:text-white flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                {provider.id === 'openai' && 'OpenAI\'s most advanced model'}
                                {provider.id === 'anthropic' && 'Anthropic\'s latest reasoning model'}
                                {provider.id === 'gemini' && 'Google\'s multimodal AI'}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="px-2.5 py-1.5 border-t border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-[#242325]/50">
                      <p className="text-[9px] text-gray-400 dark:text-gray-500">
                        Your preference is saved across all devices
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


          </div>

          {/* Right side: Send/Stop button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={isLoading ? handleStop : sendMessage}
            disabled={!input.trim() && !isLoading}
            className={`flex items-center justify-center w-9 h-9 rounded-xl
              transition-all duration-200
              ${isLoading
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : input.trim()
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90'
                  : 'bg-gray-200 dark:bg-white/[0.08] text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            aria-label={isLoading ? "Stop generation" : "Send message"}
          >
            {isLoading ? (
              <Square className="h-4 w-4 fill-current" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
