﻿import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../lib/firebase';
import { toast } from 'react-hot-toast';

const functions = getFunctions(app, 'europe-west1');

export const useCampaign = () => {
  const startCampaign = async (campaignId: string) => {
    try {
      const startCampaignFn = httpsCallable(functions, 'startCampaign');
      const result = await startCampaignFn({ campaignId });
      toast.success('Campaign started successfully');
      return result.data;
    } catch (error) {
      toast.error('Failed to start campaign');
      throw error;
    }
  };

  return { startCampaign };
}; 
