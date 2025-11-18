# Firestore Structure for CV Pipeline

## Collection: `users/{userId}/analyses/{analysisId}`

### Document Schema

```typescript
{
  // Metadata
  id: string;
  userId: string;
  jobTitle: string;
  company: string;
  location?: string;
  jobUrl?: string;
  date: Timestamp;
  status: 'processing' | 'completed' | 'failed';
  type: 'premium';
  
  // Top-level scores (for querying)
  matchScore: number; // 0-100
  
  // CV Text (parsed from Vision API)
  cvText: string; // CV brut extrait après parsing Vision API
  extractedText: string; // Alias de cvText (pour compatibilité)
  
  // Job Description
  jobDescription: string; // Description complète du poste cible
  
  // CV Rewrite (généré après analyse ATS)
  cv_rewrite?: {
    analysis: {
      positioning_strategy: string;
      strengths: string[];
      gaps: string[];
      recommended_keywords: string[];
      experience_relevance: string[];
    };
    initial_cv: string; // CV réécrit en markdown
    cv_templates: {
      tech_minimalist?: string;
      consulting?: string;
      ats_boost?: string;
      harvard?: string;
      notion?: string;
      apple?: string;
    };
    internal_prompt_used?: string;
    structured_data?: { // NOUVEAU: JSON structuré avant markdown
      experiences: Array<{
        id: string;
        title: string;
        company: string;
        startDate: string;
        endDate: string;
        bullets: string[];
      }>;
      educations: Array<{
        id: string;
        degree: string;
        institution: string;
        endDate: string;
        details?: string;
      }>;
      skills: string[];
      certifications: any[];
      languages: any[];
    };
    validation?: { // NOUVEAU: validation post-réécriture
      original_experiences_count: number;
      rewritten_experiences_count: number;
      match: boolean;
    };
  };
  
  // Validation Reports (NOUVEAU)
  cv_rewrite_validation?: {
    parsing: {
      isValid: boolean;
      warnings: string[];
      errors: string[];
      stats: {
        experiencesCount: number;
        educationsCount: number;
        skillsCount: number;
        certificationsCount: number;
        languagesCount: number;
      };
    };
    quality: {
      score: number; // 0-100
      issues: Array<{
        type: 'error' | 'warning' | 'suggestion';
        section: string;
        message: string;
        fix?: string;
      }>;
    };
    validated_at: string; // ISO timestamp
  };
  
  // ATS Analysis Data
  executive_summary?: string;
  job_summary?: {
    role: string;
    mission: string;
    key_responsibilities: string[];
    core_requirements: string[];
    hidden_expectations: string[];
  };
  match_scores?: {
    overall_score: number;
    category: string;
    skills_score: number;
    experience_score: number;
    education_score: number;
    industry_fit_score: number;
    ats_keywords_score: number;
  };
  match_breakdown?: {
    keywords: {
      missing: string[];
      found: string[];
    };
    // ... autres breakdowns
  };
  top_strengths?: Array<{ name: string; score: number }>;
  top_gaps?: Array<{ name: string; score: number }>;
}
```

## Champs Critiques pour le Pipeline

### 1. Parsing Initial (Vision API)
- **`cvText`** (string) - DOIT exister pour générer le CV rewrite
- **`extractedText`** (string) - Alias, peut être utilisé comme fallback

### 2. Réécriture CV
- **`cv_rewrite.initial_cv`** (string) - Markdown réécrit, REQUIS pour l'éditeur
- **`cv_rewrite.analysis`** (object) - Métadonnées de réécriture, REQUIS pour les keywords
- **`cv_rewrite.structured_data`** (object) - OPTIONNEL mais recommandé pour validation

### 3. Validation
- **`cv_rewrite_validation`** (object) - OPTIONNEL, ajouté après génération

## Vérifications dans Firestore Console

### Checklist de Vérification

1. **Après parsing Vision API**:
   - [ ] `cvText` existe et contient du texte
   - [ ] `jobDescription` existe et contient la description du poste
   - [ ] `jobTitle` et `company` sont présents

2. **Après génération CV Rewrite**:
   - [ ] `cv_rewrite.initial_cv` existe et contient du markdown
   - [ ] `cv_rewrite.analysis.recommended_keywords` est un array non vide
   - [ ] `cv_rewrite.structured_data.experiences` existe (si disponible)
   - [ ] `cv_rewrite_validation` existe (si validation activée)

3. **Vérification de complétude**:
   - [ ] Nombre d'expériences dans `cv_rewrite.structured_data.experiences` correspond au CV original
   - [ ] Toutes les expériences ont `id`, `title`, `company`, `bullets`
   - [ ] `cv_rewrite_validation.parsing.isValid` est `true`

## Index Firestore Recommandés

```json
{
  "indexes": [
    {
      "collectionGroup": "analyses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "analyses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "matchScore", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "analyses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "jobTitle", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## Migration Script (si nécessaire)

Si vous avez des analyses existantes sans les nouveaux champs:

```typescript
// Script de migration (à exécuter une fois)
async function migrateAnalyses() {
  const analysesRef = collection(db, 'users', userId, 'analyses');
  const snapshot = await getDocs(analysesRef);
  
  snapshot.forEach(async (doc) => {
    const data = doc.data();
    
    // Ajouter extractedText si manquant
    if (!data.extractedText && data.cvText) {
      await updateDoc(doc.ref, {
        extractedText: data.cvText,
      });
    }
    
    // Ajouter validation si cv_rewrite existe mais pas de validation
    if (data.cv_rewrite && !data.cv_rewrite_validation) {
      const parsed = parseCVData(data.cv_rewrite);
      const validation = validateParsedCV(parsed);
      const quality = checkCVQuality(parsed, {
        jobTitle: data.jobTitle,
        company: data.company,
        keywords: data.match_breakdown?.keywords?.missing || [],
      });
      
      await updateDoc(doc.ref, {
        cv_rewrite_validation: {
          parsing: validation,
          quality: quality,
          validated_at: new Date().toISOString(),
        },
      });
    }
  });
}
```

## Points d'Attention

1. **Taille des documents**: Les CVs peuvent être volumineux. Firestore limite à 1MB par document.
2. **Coûts**: Chaque lecture/écriture compte. Éviter les requêtes inutiles.
3. **Sécurité**: Les règles Firestore doivent permettre la lecture/écriture uniquement pour le propriétaire (`userId`).

## Structure Recommandée pour Nouvelles Analyses

Lors de la création d'une nouvelle analyse, s'assurer que tous ces champs sont sauvegardés:

```typescript
const analysisData = {
  id: analysisId,
  userId: currentUser.uid,
  jobTitle: jobTitle,
  company: company,
  jobDescription: jobDescription, // CRITIQUE
  cvText: cvText, // CRITIQUE - après parsing Vision
  extractedText: cvText, // Alias
  date: serverTimestamp(),
  status: 'completed',
  type: 'premium',
  matchScore: analysis.match_scores.overall_score,
  // ... autres champs d'analyse
};
```

