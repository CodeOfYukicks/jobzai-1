export interface UserStats {
  activeCampaigns: number;
  responseRate: number;
  newMatches: number;
  totalApplications: number;
  templates: number;
}

export interface Activity {
  id: string;
  type: 'application' | 'match' | 'response' | 'template';
  description: string;
  timestamp: Date;
  status?: string;
} 