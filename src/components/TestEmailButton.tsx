import { useState } from 'react';
import { toast } from '@/contexts/ToastContext';
import { Loader2 } from 'lucide-react';

interface TestEmailButtonProps {
  email: string;
  onSuccess?: (log: any) => void;
}

export default function TestEmailButton({ email, onSuccess }: TestEmailButtonProps) {
  const [isSending, setIsSending] = useState(false);

  const handleTestEmail = async () => {
    if (!email) {
      toast.error('Veuillez entrer une adresse email');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to send test email');

      toast.success('Email test envoy├® avec succ├¿s !');
      onSuccess?.(data.result);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors de l\'envoi de l\'email test');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <button
      onClick={handleTestEmail}
      disabled={isSending}
      className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50 hover:bg-purple-700 transition-colors"
    >
      {isSending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          <span>Envoi en cours...</span>
        </>
      ) : (
        'Envoyer un email test'
      )}
    </button>
  );
} 
