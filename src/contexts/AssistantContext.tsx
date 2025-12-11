import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PageContext {
  pageName: string;
  pageDescription: string;
  relevantData?: Record<string, any>;
  suggestedActions?: string[];
}

export interface UserContextForAssistant {
  firstName?: string;
  email?: string | null;
  currentJobTitle?: string;
  industry?: string;
  skills?: string[];
  yearsOfExperience?: number;
}

// Page data that components can register for the AI to access
export interface PageData {
  [key: string]: any;
}

// Pending rewrite data
export interface PendingRewrite {
  originalText: string;
  rewrittenText: string;
  actionType: string;
}

// Storage key for persisting conversations
const STORAGE_KEY = 'jobzai_assistant_conversations';

interface AssistantContextType {
  isOpen: boolean;
  openAssistant: () => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, content: string, isStreaming?: boolean) => void;
  clearMessages: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  currentPageContext: PageContext | null;
  setCurrentPageContext: (context: PageContext | null) => void;
  pendingMessage: string | null;
  setPendingMessage: (message: string | null) => void;
  // Page data registration
  pageData: PageData;
  registerPageData: (key: string, data: any) => void;
  unregisterPageData: (key: string) => void;
  clearPageData: () => void;
  // Conversation history
  conversations: Conversation[];
  currentConversationId: string | null;
  createNewConversation: () => void;
  switchConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  // Note editor integration
  noteEditorCallbacks: {
    onContentChange?: (content: any) => void;
  } | null;
  registerNoteEditor: (callbacks: { onContentChange: (content: any) => void }) => void;
  unregisterNoteEditor: () => void;
  applyNoteEdit: ((content: string) => Promise<void>) | null;
  // Rewrite workflow
  rewriteInProgress: boolean;
  setRewriteInProgress: (inProgress: boolean) => void;
  pendingRewrite: PendingRewrite | null;
  setPendingRewrite: (rewrite: PendingRewrite | null) => void;
  applyRewrite: () => Promise<void>;
  rejectRewrite: () => void;
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

// Helper to load conversations from localStorage
const loadConversationsFromStorage = (): Conversation[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      return parsed.map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
    }
  } catch (e) {
    console.error('Failed to load conversations from storage:', e);
  }
  return [];
};

// Helper to save conversations to localStorage
const saveConversationsToStorage = (conversations: Conversation[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (e) {
    console.error('Failed to save conversations to storage:', e);
  }
};

// Helper to generate a title from the first user message
const generateConversationTitle = (messages: ChatMessage[]): string => {
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (firstUserMessage) {
    const title = firstUserMessage.content.slice(0, 50);
    return title.length < firstUserMessage.content.length ? `${title}...` : title;
  }
  return 'New conversation';
};

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPageContext, setCurrentPageContext] = useState<PageContext | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  
  // Conversation history
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversationsFromStorage());
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  
  // Use ref for page data to avoid re-renders when data changes
  const pageDataRef = useRef<PageData>({});
  const [pageData, setPageData] = useState<PageData>({});
  
  // Note editor integration
  const [noteEditorCallbacks, setNoteEditorCallbacks] = useState<{
    onContentChange?: (content: any) => void;
  } | null>(null);
  
  // Rewrite workflow state
  const [rewriteInProgress, setRewriteInProgress] = useState(false);
  const [pendingRewrite, setPendingRewrite] = useState<PendingRewrite | null>(null);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    saveConversationsToStorage(conversations);
  }, [conversations]);

  // Auto-save current messages to the current conversation
  useEffect(() => {
    if (currentConversationId && messages.length > 0) {
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversationId 
          ? { 
              ...conv, 
              messages, 
              updatedAt: new Date(),
              title: conv.title === 'New conversation' ? generateConversationTitle(messages) : conv.title,
            }
          : conv
      ));
    }
  }, [messages, currentConversationId]);

  const openAssistant = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeAssistant = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleAssistant = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>): string => {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newMessage: ChatMessage = {
      ...message,
      id,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return id;
  }, []);

  const updateMessage = useCallback((id: string, content: string, isStreaming?: boolean) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id 
        ? { ...msg, content, isStreaming: isStreaming ?? msg.isStreaming } 
        : msg
    ));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Create a new conversation (saves current one first if it has messages)
  const createNewConversation = useCallback(() => {
    // If current conversation has messages, save it
    if (messages.length > 0 && currentConversationId) {
      // Already auto-saved via useEffect
    } else if (messages.length > 0 && !currentConversationId) {
      // Create a new conversation entry for current messages
      const newConv: Conversation = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: generateConversationTitle(messages),
        messages: messages,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setConversations(prev => [newConv, ...prev]);
    }
    
    // Create fresh conversation
    const freshConvId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const freshConv: Conversation = {
      id: freshConvId,
      title: 'New conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations(prev => [freshConv, ...prev]);
    setCurrentConversationId(freshConvId);
    setMessages([]);
  }, [messages, currentConversationId]);

  // Switch to a different conversation
  const switchConversation = useCallback((conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setCurrentConversationId(conversationId);
      setMessages(conversation.messages);
    }
  }, [conversations]);

  // Delete a conversation
  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    
    // If we deleted the current conversation, clear messages
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null);
      setMessages([]);
    }
  }, [currentConversationId]);

  // Page data registration functions
  const registerPageData = useCallback((key: string, data: any) => {
    pageDataRef.current = { ...pageDataRef.current, [key]: data };
    setPageData({ ...pageDataRef.current });
  }, []);

  const unregisterPageData = useCallback((key: string) => {
    const { [key]: _, ...rest } = pageDataRef.current;
    pageDataRef.current = rest;
    setPageData({ ...pageDataRef.current });
  }, []);

  const clearPageData = useCallback(() => {
    pageDataRef.current = {};
    setPageData({});
  }, []);

  // Note editor registration
  const registerNoteEditor = useCallback((callbacks: { onContentChange: (content: any) => void }) => {
    setNoteEditorCallbacks(callbacks);
  }, []);

  const unregisterNoteEditor = useCallback(() => {
    setNoteEditorCallbacks(null);
  }, []);

  // Apply note edit function
  const applyNoteEdit = useCallback(async (content: string) => {
    if (!noteEditorCallbacks?.onContentChange) {
      console.warn('No note editor registered');
      return;
    }

    try {
      // Call the registered editor's content change handler
      await noteEditorCallbacks.onContentChange(content);
    } catch (error) {
      console.error('Error applying note edit:', error);
      throw error;
    }
  }, [noteEditorCallbacks]);

  // Apply rewrite function
  const applyRewrite = useCallback(async () => {
    if (!pendingRewrite || !noteEditorCallbacks?.onContentChange) {
      console.warn('No pending rewrite or note editor registered');
      return;
    }

    try {
      setRewriteInProgress(true);
      await noteEditorCallbacks.onContentChange(pendingRewrite.rewrittenText);
      setPendingRewrite(null);
    } catch (error) {
      console.error('Error applying rewrite:', error);
      throw error;
    } finally {
      setRewriteInProgress(false);
    }
  }, [pendingRewrite, noteEditorCallbacks]);

  // Reject rewrite function
  const rejectRewrite = useCallback(() => {
    setPendingRewrite(null);
    setRewriteInProgress(false);
  }, []);

  const value: AssistantContextType = {
    isOpen,
    openAssistant,
    closeAssistant,
    toggleAssistant,
    messages,
    addMessage,
    updateMessage,
    clearMessages,
    isLoading,
    setIsLoading,
    currentPageContext,
    setCurrentPageContext,
    pendingMessage,
    setPendingMessage,
    pageData,
    registerPageData,
    unregisterPageData,
    clearPageData,
    conversations,
    currentConversationId,
    createNewConversation,
    switchConversation,
    deleteConversation,
    noteEditorCallbacks,
    registerNoteEditor,
    unregisterNoteEditor,
    applyNoteEdit,
    rewriteInProgress,
    setRewriteInProgress,
    pendingRewrite,
    setPendingRewrite,
    applyRewrite,
    rejectRewrite,
  };

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (context === undefined) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
}

