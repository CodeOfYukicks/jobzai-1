import { collection, addDoc, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface CreditHistoryEntry {
  id?: string;
  balance: number;
  change: number; // positif pour ajout, négatif pour déduction
  reason?: string; // 'campaign', 'purchase', 'refund', etc.
  referenceId?: string; // ID de la campagne, transaction, etc.
  timestamp: Date | Timestamp;
}

/**
 * Enregistre une entrée dans l'historique des crédits
 * @param userId ID de l'utilisateur
 * @param balance Nouveau solde de crédits
 * @param change Montant du changement (positif pour ajout, négatif pour déduction)
 * @param reason Raison du changement (optionnel)
 * @param referenceId ID de référence (campaign, transaction, etc.) (optionnel)
 */
export async function recordCreditHistory(
  userId: string,
  balance: number,
  change: number,
  reason?: string,
  referenceId?: string
): Promise<void> {
  try {
    const creditHistoryRef = collection(db, 'users', userId, 'creditHistory');
    
    const historyEntry = {
      balance,
      change,
      reason: reason || 'unknown',
      referenceId: referenceId || null,
      timestamp: Timestamp.now()
    };
    
    await addDoc(creditHistoryRef, historyEntry);
    console.log('✅ Credit history recorded:', { balance, change, reason, referenceId });
  } catch (error) {
    console.error('❌ Error recording credit history:', error);
    // Ne pas bloquer l'opération principale si l'enregistrement de l'historique échoue
  }
}

/**
 * Récupère l'historique des crédits pour un utilisateur
 * @param userId ID de l'utilisateur
 * @param limitCount Nombre maximum d'entrées à récupérer (par défaut: 30)
 * @returns Liste des entrées d'historique triées par date (plus récent en premier)
 */
export async function getCreditHistory(
  userId: string,
  limitCount: number = 30
): Promise<CreditHistoryEntry[]> {
  try {
    const creditHistoryRef = collection(db, 'users', userId, 'creditHistory');
    const q = query(creditHistoryRef, orderBy('timestamp', 'desc'), limit(limitCount));
    
    const snapshot = await getDocs(q);
    const history: CreditHistoryEntry[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      history.push({
        id: doc.id,
        balance: data.balance,
        change: data.change,
        reason: data.reason,
        referenceId: data.referenceId,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp)
      });
    });
    
    return history;
  } catch (error) {
    console.error('Error fetching credit history:', error);
    return [];
  }
}

/**
 * Récupère l'historique des crédits formaté pour les graphiques
 * @param userId ID de l'utilisateur
 * @param days Nombre de jours d'historique à récupérer (par défaut: 30)
 * @returns Données formatées pour les graphiques avec date, balance, change et reason
 */
export async function getCreditHistoryForChart(
  userId: string,
  days: number = 30
): Promise<Array<{ date: string; value: number; change: number; reason?: string }>> {
  const history = await getCreditHistory(userId, 100); // Récupérer plus d'entrées pour avoir une meilleure granularité
  
  console.log('📊 Credit history loaded:', history.length, 'entries');
  
  // Filtrer par nombre de jours
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const filteredHistory = history.filter(entry => {
    const entryDate = entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp);
    return entryDate >= cutoffDate;
  });
  
  console.log('📊 Filtered history (last', days, 'days):', filteredHistory.length, 'entries');
  
  // Si pas d'historique, retourner un tableau vide
  if (filteredHistory.length === 0) {
    console.log('⚠️ No credit history found');
    return [];
  }
  
  // Trier par date (plus ancien en premier pour le graphique)
  filteredHistory.sort((a, b) => {
    const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
    const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
    return dateA.getTime() - dateB.getTime();
  });
  
  const chartData = filteredHistory.map(entry => {
    const date = entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp);
    return {
      date: date.toISOString(),
      value: entry.balance,
      change: entry.change,
      reason: entry.reason
    };
  });
  
  console.log('📊 Chart data before adding initial point:', chartData.length, 'points');
  
  // Si l'historique ne contient qu'un seul point, ajouter un point initial
  // en calculant le solde précédent à partir du changement
  if (chartData.length === 1 && filteredHistory.length > 0) {
    const firstEntry = filteredHistory[0];
    // Calculer le solde précédent : balance actuelle - changement
    // Si change est négatif (déduction), previousBalance = balance - (-change) = balance + |change|
    // Si change est positif (ajout), previousBalance = balance - change
    const previousBalance = firstEntry.balance - firstEntry.change;
    const firstDate = firstEntry.timestamp instanceof Date ? firstEntry.timestamp : new Date(firstEntry.timestamp);
    
    // Créer un point initial 1 heure avant le premier point
    const previousDate = new Date(firstDate);
    previousDate.setHours(previousDate.getHours() - 1);
    
    // Ne créer le point initial que si le changement est significatif
    if (Math.abs(firstEntry.change) > 0 && previousBalance >= 0) {
      console.log('📊 Adding initial point:', { previousBalance, change: firstEntry.change, balance: firstEntry.balance });
      chartData.unshift({
        date: previousDate.toISOString(),
        value: previousBalance,
        change: 0, // Pas de changement pour le point initial
        reason: 'initial'
      });
    }
  }
  
  console.log('📊 Final chart data:', chartData.length, 'points', chartData);
  
  return chartData;
}

