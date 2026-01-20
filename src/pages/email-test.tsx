import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Loader2 } from 'lucide-react';

export default function EmailTest() {
  const [email, setEmail] = useState('');
  const [type, setType] = useState('verification');
  const [isSending, setIsSending] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const handleSendTest = async () => {
    if (!email) {
      alert('Veuillez entrer une adresse email');
      return;
    }

    setIsSending(true);
    try {
      // Use us-central1 to match backend configuration
      const functions = getFunctions(undefined, 'us-central1');
      const sendTestEmail = httpsCallable(functions, 'sendTestEmail');

      const result = await sendTestEmail({ to: email, email: email, type });

      setLogs(prev => [{
        timestamp: new Date(),
        status: 'success',
        message: `Email (${type}) envoyé avec succès`,
        to: email,
        details: result.data
      }, ...prev]);

    } catch (error: any) {
      console.error('Erreur:', error);
      setLogs(prev => [{
        timestamp: new Date(),
        status: 'error',
        message: error.message,
        to: email
      }, ...prev]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test Email</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email de test
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type d'email
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="verification">Vérification (Inscription)</option>
              <option value="welcome">Bienvenue (Après validation)</option>
              <option value="reset">Mot de passe oublié</option>
            </select>
          </div>

          <button
            onClick={handleSendTest}
            disabled={isSending}
            className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              'Envoyer un email test'
            )}
          </button>
        </div>
      </div>

      {/* Logs Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium mb-4">Logs des tests</h2>
        <div className="space-y-2">
          {logs.map((log, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${log.status === 'success' ? 'bg-green-50' : 'bg-red-50'
                }`}
            >
              <div className="flex justify-between">
                <span className="font-medium">
                  {log.status === 'success' ? '✅ ' : '❌ '}
                  {log.message}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="text-sm mt-1">
                Envoyé à : {log.to}
              </div>
              {log.details && (
                <pre className="text-xs bg-gray-50 p-2 mt-2 rounded overflow-auto">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
