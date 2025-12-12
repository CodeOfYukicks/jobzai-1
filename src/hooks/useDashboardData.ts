import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { getCreditHistoryForChart } from '../lib/creditHistory';
import { JobApplication, Interview, KanbanBoard } from '../types/job';

// Period filter options
export type PeriodFilter = '7d' | '30d' | '3m' | '6m' | '1y' | 'all';

// Campaign recipient interface
interface CampaignRecipient {
  id: string;
  status: 'pending' | 'email_generated' | 'email_ready' | 'sent' | 'opened' | 'replied';
  emailGenerated: boolean;
  sentAt: any;
  openedAt: any;
  repliedAt: any;
  createdAt: any;
  fullName: string;
  company: string | null;
  title: string | null;
}

// Campaign interface
interface Campaign {
  id: string;
  name?: string;
  status: string;
  stats: {
    contactsFound: number;
    emailsGenerated: number;
    emailsSent: number;
    opened: number;
    replied: number;
    bounced: number;
  };
  targeting?: {
    personTitles?: string[];
    personLocations?: string[];
    industries?: string[];
  };
  createdAt: any;
  updatedAt: any;
}

// Dashboard stats interface
export interface DashboardStats {
  // Credits
  credits: number;
  creditsHistory: Array<{ date: string; value: number; change: number; reason?: string }>;
  
  // Applications stats
  totalApplications: number;
  applicationsByStatus: Record<string, number>;
  activeApplications: number;
  interviewCount: number;
  offerCount: number;
  rejectedCount: number;
  
  // Applications metrics
  responseRate: number;
  interviewRate: number;
  offerRate: number;
  avgDaysToInterview: number;
  avgDaysToOffer: number;
  
  // Trends (vs previous period)
  applicationsTrend: number;
  responseRateTrend: number;
  interviewRateTrend: number;
  
  // Campaigns stats
  totalCampaigns: number;
  totalContacts: number;
  emailsSent: number;
  emailsOpened: number;
  emailsReplied: number;
  
  // Campaigns metrics
  openRate: number;
  replyRate: number;
  meetingRate: number;
  
  // Campaigns trends
  contactsTrend: number;
  replyRateTrend: number;
  
  // Upcoming interviews
  upcomingInterviews: Array<{
    id: string;
    applicationId: string;
    companyName: string;
    position: string;
    date: string;
    time: string;
    type: string;
    location?: string;
  }>;
  
  // Recent activity
  recentActivity: Array<{
    id: string;
    type: 'application' | 'interview' | 'status_change' | 'email_sent' | 'email_opened' | 'email_replied';
    title: string;
    subtitle: string;
    timestamp: Date;
    status?: string;
  }>;
  
  // Applications pipeline (for funnel)
  applicationsPipeline: {
    wishlist: number;
    applied: number;
    interview: number;
    pending_decision: number;
    offer: number;
    rejected: number;
  };
  
  // Campaigns pipeline (for funnel)
  campaignsPipeline: {
    pending: number;
    generated: number;
    sent: number;
    opened: number;
    replied: number;
  };
  
  // Insights
  topIndustries: Array<{ industry: string; count: number; successRate: number }>;
  topTechnologies: Array<{ tech: string; count: number; successRate: number }>;
  locationDistribution: Array<{ type: string; count: number; successRate: number }>;
  companySizeDistribution: Array<{ size: string; count: number; successRate: number }>;
  
  // Recent applications
  recentApplications: Array<{
    id: string;
    companyName: string;
    position: string;
    status: string;
    appliedDate: string;
  }>;
  
  // Recent replies
  recentReplies: Array<{
    id: string;
    contactName: string;
    company: string;
    repliedAt: Date;
  }>;
}

// Refresh state
interface RefreshState {
  lastRefresh: Date | null;
  isRefreshing: boolean;
}

const REFRESH_STORAGE_KEY = 'dashboard_last_refresh';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Helper to get period start date
function getPeriodStartDate(period: PeriodFilter): Date | null {
  const now = new Date();
  switch (period) {
    case '7d':
      return new Date(now.getTime() - 7 * ONE_DAY_MS);
    case '30d':
      return new Date(now.getTime() - 30 * ONE_DAY_MS);
    case '3m':
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case '6m':
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    case '1y':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    case 'all':
    default:
      return null;
  }
}

// Helper to filter by date
function isInPeriod(date: Date | string | any, periodStart: Date | null): boolean {
  if (!periodStart) return true;
  const itemDate = date instanceof Date ? date : new Date(date?.toDate?.() || date);
  return itemDate >= periodStart;
}

export function useDashboardData(periodFilter: PeriodFilter = 'all', boardFilter: string | null = null) {
  const { currentUser } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshState, setRefreshState] = useState<RefreshState>({
    lastRefresh: null,
    isRefreshing: false,
  });
  
  // Raw data
  const [userData, setUserData] = useState<{ credits: number; plan?: string }>({ credits: 0 });
  const [creditsHistory, setCreditsHistory] = useState<Array<{ date: string; value: number; change: number; reason?: string }>>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [allRecipients, setAllRecipients] = useState<CampaignRecipient[]>([]);
  
  // Check if auto-refresh is needed
  useEffect(() => {
    const lastRefreshStr = localStorage.getItem(REFRESH_STORAGE_KEY);
    if (lastRefreshStr) {
      const lastRefresh = new Date(lastRefreshStr);
      const now = new Date();
      const needsRefresh = now.getTime() - lastRefresh.getTime() > ONE_DAY_MS;
      
      setRefreshState(prev => ({
        ...prev,
        lastRefresh,
        isRefreshing: needsRefresh,
      }));
    }
  }, []);
  
  // Manual refresh function
  const refresh = useCallback(async () => {
    setRefreshState(prev => ({ ...prev, isRefreshing: true }));
    
    // Trigger re-fetch by updating timestamp
    const now = new Date();
    localStorage.setItem(REFRESH_STORAGE_KEY, now.toISOString());
    
    // Reload credit history
    if (currentUser) {
      const history = await getCreditHistoryForChart(currentUser.uid, 30);
      setCreditsHistory(history);
    }
    
    setRefreshState({ lastRefresh: now, isRefreshing: false });
  }, [currentUser]);
  
  // Load user data and credits
  useEffect(() => {
    if (!currentUser) return;
    
    const unsubUser = onSnapshot(
      doc(db, 'users', currentUser.uid),
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData({
            credits: data.credits || 0,
            plan: data.plan,
          });
        }
      }
    );
    
    // Load credit history
    getCreditHistoryForChart(currentUser.uid, 30).then(setCreditsHistory);
    
    return () => unsubUser();
  }, [currentUser]);
  
  // Load boards
  useEffect(() => {
    if (!currentUser) return;
    
    const boardsQuery = query(
      collection(db, 'users', currentUser.uid, 'boards'),
      orderBy('createdAt', 'asc')
    );
    
    const unsubBoards = onSnapshot(boardsQuery, (snapshot) => {
      const boardsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as KanbanBoard[];
      setBoards(boardsData);
    });
    
    return () => unsubBoards();
  }, [currentUser]);
  
  // Load applications
  useEffect(() => {
    if (!currentUser) return;
    
    const appsQuery = query(
      collection(db, 'users', currentUser.uid, 'jobApplications'),
      orderBy('appliedDate', 'desc')
    );
    
    const unsubApps = onSnapshot(appsQuery, (snapshot) => {
      const appsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as JobApplication[];
      setApplications(appsData);
    });
    
    return () => unsubApps();
  }, [currentUser]);
  
  // Load campaigns and recipients
  useEffect(() => {
    if (!currentUser) return;
    
    const campaignsQuery = query(
      collection(db, 'campaigns'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubCampaigns = onSnapshot(campaignsQuery, async (snapshot) => {
      const campaignsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Campaign[];
      setCampaigns(campaignsData);
      
      // Load recipients for all campaigns
      const recipientsPromises = campaignsData.map(async (campaign) => {
        const recipientsQuery = query(
          collection(db, 'campaigns', campaign.id, 'recipients'),
          orderBy('createdAt', 'desc')
        );
        const recipientsSnap = await getDocs(recipientsQuery);
        return recipientsSnap.docs.map(doc => ({
          id: doc.id,
          campaignId: campaign.id,
          ...doc.data()
        })) as (CampaignRecipient & { campaignId: string })[];
      });
      
      const allRecipientsArrays = await Promise.all(recipientsPromises);
      setAllRecipients(allRecipientsArrays.flat());
      setIsLoading(false);
    });
    
    return () => unsubCampaigns();
  }, [currentUser]);
  
  // Compute filtered data and stats
  const stats = useMemo<DashboardStats>(() => {
    const periodStart = getPeriodStartDate(periodFilter);
    
    // Filter applications by period and board
    let filteredApps = applications.filter(app => 
      isInPeriod(app.appliedDate, periodStart)
    );
    
    if (boardFilter && boardFilter !== 'all') {
      filteredApps = filteredApps.filter(app => app.boardId === boardFilter);
    }
    
    // Filter recipients by period
    const filteredRecipients = allRecipients.filter(r => 
      isInPeriod(r.createdAt, periodStart)
    );
    
    // Applications by status
    const appsByStatus: Record<string, number> = {};
    const jobStatuses = ['wishlist', 'applied', 'interview', 'pending_decision', 'offer', 'rejected', 'archived'];
    jobStatuses.forEach(s => appsByStatus[s] = 0);
    
    filteredApps.forEach(app => {
      const status = app.status || 'applied';
      appsByStatus[status] = (appsByStatus[status] || 0) + 1;
    });
    
    // Active applications (not rejected/archived)
    const activeApps = filteredApps.filter(app => 
      !['rejected', 'archived'].includes(app.status)
    );
    
    // Count interviews and offers
    const interviewApps = filteredApps.filter(app => 
      app.status === 'interview' || (app.interviews && app.interviews.length > 0)
    );
    const offerApps = filteredApps.filter(app => app.status === 'offer');
    const rejectedApps = filteredApps.filter(app => app.status === 'rejected');
    
    // Response rate = apps that got any response / total
    const appsWithResponse = filteredApps.filter(app => 
      !['applied', 'wishlist'].includes(app.status)
    );
    const responseRate = filteredApps.length > 0 
      ? (appsWithResponse.length / filteredApps.length) * 100 
      : 0;
    
    const interviewRate = filteredApps.length > 0 
      ? (interviewApps.length / filteredApps.length) * 100 
      : 0;
    
    const offerRate = filteredApps.length > 0 
      ? (offerApps.length / filteredApps.length) * 100 
      : 0;
    
    // Calculate avg days to interview/offer
    let totalDaysToInterview = 0;
    let countWithInterview = 0;
    let totalDaysToOffer = 0;
    let countWithOffer = 0;
    
    filteredApps.forEach(app => {
      if (app.statusHistory && app.statusHistory.length > 0) {
        const appliedEntry = app.statusHistory.find(h => h.status === 'applied');
        const interviewEntry = app.statusHistory.find(h => h.status === 'interview');
        const offerEntry = app.statusHistory.find(h => h.status === 'offer');
        
        if (appliedEntry && interviewEntry) {
          const appliedDate = new Date(appliedEntry.date);
          const interviewDate = new Date(interviewEntry.date);
          const days = Math.round((interviewDate.getTime() - appliedDate.getTime()) / ONE_DAY_MS);
          if (days >= 0) {
            totalDaysToInterview += days;
            countWithInterview++;
          }
        }
        
        if (interviewEntry && offerEntry) {
          const interviewDate = new Date(interviewEntry.date);
          const offerDate = new Date(offerEntry.date);
          const days = Math.round((offerDate.getTime() - interviewDate.getTime()) / ONE_DAY_MS);
          if (days >= 0) {
            totalDaysToOffer += days;
            countWithOffer++;
          }
        }
      }
    });
    
    // Calculate trends (compare to previous period)
    const previousPeriodStart = periodStart 
      ? new Date(periodStart.getTime() - (new Date().getTime() - periodStart.getTime()))
      : null;
    
    const previousApps = previousPeriodStart 
      ? applications.filter(app => {
          const appDate = new Date(app.appliedDate);
          return appDate >= previousPeriodStart && appDate < (periodStart || new Date());
        })
      : [];
    
    const applicationsTrend = previousApps.length > 0 
      ? ((filteredApps.length - previousApps.length) / previousApps.length) * 100
      : 0;
    
    // Campaigns stats
    const sentRecipients = filteredRecipients.filter(r => 
      ['sent', 'opened', 'replied'].includes(r.status)
    );
    const openedRecipients = filteredRecipients.filter(r => 
      ['opened', 'replied'].includes(r.status)
    );
    const repliedRecipients = filteredRecipients.filter(r => r.status === 'replied');
    
    const openRate = sentRecipients.length > 0 
      ? (openedRecipients.length / sentRecipients.length) * 100 
      : 0;
    
    const replyRate = sentRecipients.length > 0 
      ? (repliedRecipients.length / sentRecipients.length) * 100 
      : 0;
    
    // Campaigns pipeline
    const campaignsPipeline = {
      pending: filteredRecipients.filter(r => r.status === 'pending').length,
      generated: filteredRecipients.filter(r => ['email_generated', 'email_ready'].includes(r.status)).length,
      sent: filteredRecipients.filter(r => r.status === 'sent').length,
      opened: filteredRecipients.filter(r => r.status === 'opened').length,
      replied: filteredRecipients.filter(r => r.status === 'replied').length,
    };
    
    // Upcoming interviews (next 7 days)
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * ONE_DAY_MS);
    
    const upcomingInterviews: DashboardStats['upcomingInterviews'] = [];
    filteredApps.forEach(app => {
      if (app.interviews) {
        app.interviews.forEach(interview => {
          if (interview.status === 'scheduled') {
            const interviewDate = new Date(`${interview.date}T${interview.time || '00:00'}`);
            if (interviewDate >= now && interviewDate <= oneWeekFromNow) {
              upcomingInterviews.push({
                id: interview.id,
                applicationId: app.id,
                companyName: app.companyName,
                position: app.position,
                date: interview.date,
                time: interview.time,
                type: interview.type,
                location: interview.location,
              });
            }
          }
        });
      }
    });
    
    // Sort by date
    upcomingInterviews.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
      return dateA.getTime() - dateB.getTime();
    });
    
    // Recent activity (last 10 items)
    const recentActivity: DashboardStats['recentActivity'] = [];
    
    // Add recent applications
    filteredApps.slice(0, 5).forEach(app => {
      recentActivity.push({
        id: `app-${app.id}`,
        type: 'application',
        title: `Applied to ${app.companyName}`,
        subtitle: app.position,
        timestamp: new Date(app.appliedDate),
        status: app.status,
      });
    });
    
    // Add recent email replies
    repliedRecipients.slice(0, 5).forEach(r => {
      recentActivity.push({
        id: `reply-${r.id}`,
        type: 'email_replied',
        title: `Reply from ${r.fullName || 'Contact'}`,
        subtitle: r.company || 'Unknown company',
        timestamp: r.repliedAt?.toDate?.() || new Date(r.repliedAt),
      });
    });
    
    // Sort by timestamp
    recentActivity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Industry distribution
    const industryMap: Record<string, { count: number; success: number }> = {};
    filteredApps.forEach(app => {
      if (app.jobTags?.industry) {
        app.jobTags.industry.forEach(ind => {
          if (!industryMap[ind]) industryMap[ind] = { count: 0, success: 0 };
          industryMap[ind].count++;
          if (['interview', 'offer'].includes(app.status)) {
            industryMap[ind].success++;
          }
        });
      }
    });
    
    const topIndustries = Object.entries(industryMap)
      .map(([industry, data]) => ({
        industry,
        count: data.count,
        successRate: data.count > 0 ? (data.success / data.count) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Technology distribution
    const techMap: Record<string, { count: number; success: number }> = {};
    filteredApps.forEach(app => {
      if (app.jobTags?.technologies) {
        app.jobTags.technologies.forEach(tech => {
          if (!techMap[tech]) techMap[tech] = { count: 0, success: 0 };
          techMap[tech].count++;
          if (['interview', 'offer'].includes(app.status)) {
            techMap[tech].success++;
          }
        });
      }
    });
    
    const topTechnologies = Object.entries(techMap)
      .map(([tech, data]) => ({
        tech,
        count: data.count,
        successRate: data.count > 0 ? (data.success / data.count) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Location distribution (Remote/Hybrid/On-site)
    const locationMap: Record<string, { count: number; success: number }> = {
      'Remote': { count: 0, success: 0 },
      'Hybrid': { count: 0, success: 0 },
      'On-site': { count: 0, success: 0 },
    };
    
    filteredApps.forEach(app => {
      let locationType = 'On-site';
      if (app.jobTags?.location) {
        if (app.jobTags.location.remote && app.jobTags.location.hybrid) {
          locationType = 'Hybrid';
        } else if (app.jobTags.location.remote) {
          locationType = 'Remote';
        }
      }
      locationMap[locationType].count++;
      if (['interview', 'offer'].includes(app.status)) {
        locationMap[locationType].success++;
      }
    });
    
    const locationDistribution = Object.entries(locationMap)
      .filter(([, data]) => data.count > 0)
      .map(([type, data]) => ({
        type,
        count: data.count,
        successRate: data.count > 0 ? (data.success / data.count) * 100 : 0,
      }));
    
    // Company size distribution
    const sizeMap: Record<string, { count: number; success: number }> = {};
    filteredApps.forEach(app => {
      const size = app.jobTags?.companySize || 'Unknown';
      if (!sizeMap[size]) sizeMap[size] = { count: 0, success: 0 };
      sizeMap[size].count++;
      if (['interview', 'offer'].includes(app.status)) {
        sizeMap[size].success++;
      }
    });
    
    const companySizeDistribution = Object.entries(sizeMap)
      .map(([size, data]) => ({
        size,
        count: data.count,
        successRate: data.count > 0 ? (data.success / data.count) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
    
    // Recent applications (for table)
    const recentApplications = filteredApps.slice(0, 10).map(app => ({
      id: app.id,
      companyName: app.companyName,
      position: app.position,
      status: app.status,
      appliedDate: app.appliedDate,
    }));
    
    // Recent replies
    const recentReplies = repliedRecipients.slice(0, 5).map(r => ({
      id: r.id,
      contactName: r.fullName || 'Unknown',
      company: r.company || 'Unknown',
      repliedAt: r.repliedAt?.toDate?.() || new Date(r.repliedAt),
    }));
    
    return {
      // Credits
      credits: userData.credits,
      creditsHistory,
      
      // Applications stats
      totalApplications: filteredApps.length,
      applicationsByStatus: appsByStatus,
      activeApplications: activeApps.length,
      interviewCount: interviewApps.length,
      offerCount: offerApps.length,
      rejectedCount: rejectedApps.length,
      
      // Applications metrics
      responseRate,
      interviewRate,
      offerRate,
      avgDaysToInterview: countWithInterview > 0 ? Math.round(totalDaysToInterview / countWithInterview) : 0,
      avgDaysToOffer: countWithOffer > 0 ? Math.round(totalDaysToOffer / countWithOffer) : 0,
      
      // Trends
      applicationsTrend,
      responseRateTrend: 0, // TODO: calculate properly
      interviewRateTrend: 0, // TODO: calculate properly
      
      // Campaigns stats
      totalCampaigns: campaigns.length,
      totalContacts: filteredRecipients.length,
      emailsSent: sentRecipients.length,
      emailsOpened: openedRecipients.length,
      emailsReplied: repliedRecipients.length,
      
      // Campaigns metrics
      openRate,
      replyRate,
      meetingRate: 0, // TODO: implement meetings tracking
      
      // Campaigns trends
      contactsTrend: 0, // TODO: calculate properly
      replyRateTrend: 0, // TODO: calculate properly
      
      // Upcoming interviews
      upcomingInterviews,
      
      // Recent activity
      recentActivity: recentActivity.slice(0, 10),
      
      // Applications pipeline
      applicationsPipeline: {
        wishlist: appsByStatus.wishlist || 0,
        applied: appsByStatus.applied || 0,
        interview: appsByStatus.interview || 0,
        pending_decision: appsByStatus.pending_decision || 0,
        offer: appsByStatus.offer || 0,
        rejected: appsByStatus.rejected || 0,
      },
      
      // Campaigns pipeline
      campaignsPipeline,
      
      // Insights
      topIndustries,
      topTechnologies,
      locationDistribution,
      companySizeDistribution,
      
      // Recent data
      recentApplications,
      recentReplies,
    };
  }, [applications, allRecipients, campaigns, userData, creditsHistory, periodFilter, boardFilter]);
  
  return {
    stats,
    boards,
    campaigns,
    isLoading,
    isRefreshing: refreshState.isRefreshing,
    lastRefresh: refreshState.lastRefresh,
    refresh,
  };
}

export default useDashboardData;

