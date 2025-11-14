export interface Interview {
  id: string;
  date: string;
  time: string;
  type: 'technical' | 'hr' | 'manager' | 'final' | 'other';
  interviewers?: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  location?: string;
}

export interface StatusChange {
  status:
    | 'applied'
    | 'interview'
    | 'offer'
    | 'rejected'
    | 'archived'
    | 'pending_decision';
  date: string;
  notes?: string;
}

export interface JobApplication {
  id: string;
  companyName: string;
  position: string;
  location: string;
  status:
    | 'applied'
    | 'interview'
    | 'offer'
    | 'rejected'
    | 'archived'
    | 'pending_decision';
  appliedDate: string;
  url?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  salary?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  interviews?: Interview[];
  statusHistory?: StatusChange[];
}



