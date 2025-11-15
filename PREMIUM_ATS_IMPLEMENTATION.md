# Premium ATS Analysis - Implementation Guide

## Overview

This guide provides technical implementation details for the Premium ATS Analysis system, including Cloud Functions, frontend integration, and TypeScript types.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  1. Upload CV (PDF/DOCX/Image)                        │ │
│  │  2. Convert to base64 images                          │ │
│  │  3. Enter job context                                 │ │
│  └───────────────────────────────────────────────────────┘ │
│                            │                                │
│                            ▼                                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  POST /api/analyze-cv-premium                         │ │
│  │  {                                                    │ │
│  │    resumeImages: string[],                           │ │
│  │    jobContext: {...},                                │ │
│  │    userId: string,                                   │ │
│  │    analysisId: string                                │ │
│  │  }                                                    │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Cloud Function                            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  analyzeCVPremium                                     │ │
│  │  1. Validate input                                    │ │
│  │  2. Get OpenAI client                                 │ │
│  │  3. Build premium prompt                              │ │
│  │  4. Call GPT-4o Vision API                           │ │
│  │  5. Parse JSON response                               │ │
│  │  6. Save to Firestore                                 │ │
│  │  7. Return analysis                                   │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      OpenAI GPT-4o                          │
│  • Vision capability (reads resume images)                  │
│  • Structured JSON output                                   │
│  • Premium ATS analysis prompt                              │
│  • 8000 token max output                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Firestore Database                       │
│  users/{userId}/analyses/{analysisId}                       │
│  • Full analysis JSON                                       │
│  • Match scores                                             │
│  • Timestamps                                               │
│  • Job metadata                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Cloud Function Setup

### 1. Deploy the Function

```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Build TypeScript
npm run build

# Deploy to Firebase
firebase deploy --only functions:analyzeCVPremium
```

### 2. Environment Configuration

Ensure OpenAI API key is configured in Firestore:

```
Firestore Collection: settings
Document ID: openai
Field: apiKey (string)
Value: sk-...
```

Or set as environment variable:

```bash
firebase functions:config:set openai.api_key="sk-..."
```

### 3. Function Configuration

The function is configured with:
- **Region**: `us-central1`
- **Timeout**: 300 seconds (5 minutes)
- **Max Instances**: 10
- **CORS**: Enabled
- **Authentication**: Public (uses user ID in request body)

---

## API Reference

### Endpoint

```
POST https://us-central1-[project-id].cloudfunctions.net/analyzeCVPremium
```

### Request Body

```typescript
{
  // Array of base64-encoded resume images
  // Can be PDF pages converted to images or direct image uploads
  resumeImages: string[]; // ["data:image/jpeg;base64,..."]
  
  // Job context for analysis
  jobContext: {
    jobTitle: string;        // "Senior Frontend Engineer"
    company: string;         // "Apple"
    jobDescription: string;  // Full job description text
    seniority?: string;      // "Senior", "Staff", "Principal"
    targetRoles?: string[];  // ["Frontend", "Full Stack"]
    location?: string;       // "San Francisco, CA"
    jobUrl?: string;         // "https://..."
  };
  
  // User identification for Firestore storage
  userId: string;            // Firebase Auth UID
  analysisId: string;        // Unique analysis ID
}
```

### Response

#### Success (200)

```typescript
{
  status: "success",
  analysis: {
    analysis: {
      executive_summary: string,
      job_summary: {...},
      match_scores: {...},
      match_breakdown: {...},
      top_strengths: [...],
      top_gaps: [...],
      cv_fixes: {...},
      action_plan_48h: {...},
      learning_path: {...},
      opportunity_fit: {...}
    },
    product_updates: {
      new_analysis_flow: {...},
      ats_analysis_page_design: {...}
    }
  },
  usage: {
    prompt_tokens: number,
    completion_tokens: number,
    total_tokens: number
  },
  analysisId: string
}
```

#### Error (400/500)

```typescript
{
  status: "error",
  message: string,
  error?: object
}
```

---

## TypeScript Types

### Import Types

```typescript
import type { 
  PremiumATSAnalysis,
  Analysis,
  MatchScores,
  Strength,
  Gap,
  CVFixes,
  ActionPlan48H,
  LearningPath,
  OpportunityFit
} from '@/functions/src/types/premiumATSAnalysis';
```

### Usage Example

```typescript
interface AnalysisResponse {
  status: 'success' | 'error';
  analysis?: PremiumATSAnalysis;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  analysisId?: string;
  message?: string;
}

async function analyzeResume(
  resumeImages: string[],
  jobContext: JobContext,
  userId: string,
  analysisId: string
): Promise<AnalysisResponse> {
  const response = await fetch(
    'https://us-central1-[project-id].cloudfunctions.net/analyzeCVPremium',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeImages,
        jobContext,
        userId,
        analysisId,
      }),
    }
  );
  
  return await response.json();
}
```

---

## Frontend Integration

### 1. PDF to Images Conversion

```typescript
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Set worker
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

async function convertPDFToImages(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument(arrayBuffer).promise;
  const images: string[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: context, viewport }).promise;
    
    // Convert to base64
    const base64 = canvas.toDataURL('image/jpeg', 0.9);
    images.push(base64);
  }
  
  return images;
}
```

### 2. Upload Component

```typescript
import { useState } from 'react';
import { convertPDFToImages } from '@/lib/pdfUtils';

export function CVUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setLoading(true);
    
    try {
      // Convert PDF to images
      const images = await convertPDFToImages(selectedFile);
      console.log(`Converted ${images.length} pages`);
      
      // Store images for analysis
      // ...
    } catch (error) {
      console.error('Error converting PDF:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="upload-container">
      <input
        type="file"
        accept=".pdf,.docx,image/*"
        onChange={handleFileChange}
      />
      {loading && <p>Converting PDF...</p>}
    </div>
  );
}
```

### 3. Analysis Flow Component

```typescript
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export function NewAnalysisFlow() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [resumeImages, setResumeImages] = useState<string[]>([]);
  const [jobContext, setJobContext] = useState({
    jobTitle: '',
    company: '',
    jobDescription: '',
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const handleAnalyze = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setProgress(0);
    
    try {
      // Generate analysis ID
      const analysisId = crypto.randomUUID();
      
      // Create placeholder in Firestore
      await setDoc(doc(db, 'users', currentUser.uid, 'analyses', analysisId), {
        status: 'processing',
        jobTitle: jobContext.jobTitle,
        company: jobContext.company,
        createdAt: new Date().toISOString(),
      });
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 95));
      }, 500);
      
      // Call Cloud Function
      const response = await fetch(
        'https://us-central1-[project-id].cloudfunctions.net/analyzeCVPremium',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resumeImages,
            jobContext,
            userId: currentUser.uid,
            analysisId,
          }),
        }
      );
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        throw new Error('Analysis failed');
      }
      
      const data = await response.json();
      
      setProgress(100);
      
      // Redirect to analysis page
      setTimeout(() => {
        router.push(`/ats-analysis/${analysisId}`);
      }, 1000);
      
    } catch (error) {
      console.error('Error analyzing CV:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      {/* Upload UI */}
      {/* Job input UI */}
      {loading && (
        <div className="loading-state">
          <div className="progress-ring">{progress}%</div>
          <p>Analyzing your experience...</p>
        </div>
      )}
      <button onClick={handleAnalyze} disabled={loading}>
        Analyze My Resume
      </button>
    </div>
  );
}
```

### 4. Analysis Display Component

```typescript
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { PremiumATSAnalysis } from '@/functions/src/types/premiumATSAnalysis';

export function ATSAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const [analysis, setAnalysis] = useState<PremiumATSAnalysis['analysis'] | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!id || !currentUser) return;
    
    const fetchAnalysis = async () => {
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'analyses', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setAnalysis(docSnap.data() as PremiumATSAnalysis['analysis']);
        }
      } catch (error) {
        console.error('Error fetching analysis:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalysis();
  }, [id, currentUser]);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!analysis) {
    return <NotFound />;
  }
  
  return (
    <div className="analysis-page">
      {/* Hero Section */}
      <div className="hero">
        <ScoreDonut value={analysis.match_scores.overall_score} />
        <h1>{analysis.match_scores.category} Match</h1>
        <p>{analysis.executive_summary}</p>
      </div>
      
      {/* Sections */}
      <MatchBreakdown data={analysis.match_breakdown} />
      <TopStrengths strengths={analysis.top_strengths} />
      <TopGaps gaps={analysis.top_gaps} />
      <CVFixes fixes={analysis.cv_fixes} />
      <ActionPlan plan={analysis.action_plan_48h} />
      <LearningPath path={analysis.learning_path} />
      <OpportunityFit fit={analysis.opportunity_fit} />
    </div>
  );
}
```

---

## Firestore Data Structure

### Collection Path

```
users/{userId}/analyses/{analysisId}
```

### Document Schema

```typescript
{
  // Metadata
  id: string,
  userId: string,
  jobTitle: string,
  company: string,
  location: string | null,
  jobUrl: string | null,
  date: Timestamp,
  status: 'processing' | 'completed' | 'failed',
  type: 'premium',
  
  // Top-level scores (for querying)
  matchScore: number,           // 0-100
  category: string,             // "Weak" | "Medium" | "Strong" | "Excellent"
  
  // Full analysis data
  executive_summary: string,
  job_summary: {
    role: string,
    mission: string,
    key_responsibilities: string[],
    core_requirements: string[],
    hidden_expectations: string[]
  },
  match_scores: {
    overall_score: number,
    category: string,
    skills_score: number,
    experience_score: number,
    education_score: number,
    industry_fit_score: number,
    ats_keywords_score: number
  },
  match_breakdown: { ... },
  top_strengths: [ ... ],
  top_gaps: [ ... ],
  cv_fixes: { ... },
  action_plan_48h: { ... },
  learning_path: { ... },
  opportunity_fit: { ... },
  
  // For backward compatibility
  categoryScores: {
    skills: number,
    experience: number,
    education: number,
    industryFit: number
  },
  keyFindings: string // Same as executive_summary
}
```

### Firestore Queries

```typescript
// Get all analyses for a user
const analysesRef = collection(db, 'users', userId, 'analyses');
const q = query(analysesRef, orderBy('date', 'desc'));
const snapshot = await getDocs(q);

// Get analyses by match score
const highMatchQuery = query(
  analysesRef,
  where('matchScore', '>=', 80),
  orderBy('matchScore', 'desc')
);

// Get analyses by job title
const jobQuery = query(
  analysesRef,
  where('jobTitle', '==', 'Senior Frontend Engineer'),
  orderBy('date', 'desc')
);
```

---

## Testing

### Manual Testing

1. **Test Upload Flow**
   ```
   - Upload PDF resume
   - Upload DOCX resume
   - Upload image resume
   - Test file validation (max size, file types)
   ```

2. **Test Analysis**
   ```
   - Enter job details manually
   - Paste job link (LinkedIn, Indeed, etc.)
   - Submit analysis
   - Verify loading states
   - Check analysis results
   ```

3. **Test Analysis Page**
   ```
   - Verify score display
   - Check all sections render
   - Test expandable sections
   - Verify copy-to-clipboard
   - Test responsive layout
   ```

### Automated Testing

```typescript
// Example test
import { analyzeCVPremium } from '@/functions/src';

describe('Premium ATS Analysis', () => {
  it('should analyze resume and return valid JSON', async () => {
    const mockRequest = {
      body: {
        resumeImages: ['data:image/jpeg;base64,...'],
        jobContext: {
          jobTitle: 'Senior Engineer',
          company: 'Test Company',
          jobDescription: 'Test description...',
        },
        userId: 'test-user-id',
        analysisId: 'test-analysis-id',
      },
      method: 'POST',
      headers: {},
    };
    
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    
    await analyzeCVPremium(mockRequest as any, mockResponse as any);
    
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        analysis: expect.any(Object),
      })
    );
  });
});
```

---

## Monitoring & Logging

### Cloud Function Logs

View logs in Firebase Console or via CLI:

```bash
firebase functions:log --only analyzeCVPremium
```

### Key Metrics to Monitor

1. **Function Execution**
   - Invocation count
   - Error rate
   - Execution time (should be < 60s)
   - Memory usage

2. **OpenAI API**
   - API call success rate
   - Token usage (prompt + completion)
   - Cost per analysis

3. **User Metrics**
   - Analysis completion rate
   - Time to complete flow
   - Drop-off points
   - User satisfaction (if surveyed)

### Error Handling

```typescript
// Client-side error handling
try {
  const response = await analyzeResume(...);
  if (response.status === 'error') {
    // Show user-friendly error message
    toast.error('Analysis failed. Please try again.');
    
    // Log to monitoring service
    console.error('Analysis error:', response.message);
  }
} catch (error) {
  // Network or parsing error
  toast.error('Connection error. Please check your internet.');
  console.error('Network error:', error);
}
```

---

## Cost Optimization

### OpenAI API Costs

**GPT-4o Pricing** (as of 2024):
- Input: $5.00 / 1M tokens
- Output: $15.00 / 1M tokens

**Estimated Cost per Analysis**:
- Prompt: ~3,000 tokens ($0.015)
- Completion: ~5,000 tokens ($0.075)
- **Total: ~$0.09 per analysis**

### Optimization Strategies

1. **Reduce Image Size**
   ```typescript
   // Compress images before sending
   const compressedImages = await Promise.all(
     images.map(img => compressImage(img, { quality: 0.8 }))
   );
   ```

2. **Cache Frequent Job Descriptions**
   ```typescript
   // Store commonly analyzed jobs
   const cachedJob = await getCachedJobDescription(jobUrl);
   if (cachedJob) {
     jobContext.jobDescription = cachedJob;
   }
   ```

3. **Batch Analyses**
   ```typescript
   // Allow users to analyze multiple resumes at once
   // Share job description parsing across analyses
   ```

---

## Security Considerations

### 1. API Key Protection

- **Never expose API key in client code**
- Store in Firestore or Firebase Functions config
- Rotate keys regularly

### 2. User Authentication

```typescript
// Verify user is authenticated
if (!userId || !currentUser) {
  return res.status(401).json({
    status: 'error',
    message: 'Unauthorized',
  });
}

// Verify user owns the analysis
const analysisRef = doc(db, 'users', userId, 'analyses', analysisId);
const analysisSnap = await getDoc(analysisRef);
if (!analysisSnap.exists() || analysisSnap.data().userId !== userId) {
  return res.status(403).json({
    status: 'error',
    message: 'Forbidden',
  });
}
```

### 3. Input Validation

```typescript
// Validate file size
if (file.size > 10 * 1024 * 1024) {
  throw new Error('File size exceeds 10MB limit');
}

// Validate file type
const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
if (!validTypes.includes(file.type)) {
  throw new Error('Invalid file type');
}

// Sanitize job description
const sanitizedDescription = sanitizeHtml(jobContext.jobDescription);
```

### 4. Rate Limiting

```typescript
// Implement rate limiting per user
const rateLimitKey = `analysis:${userId}`;
const recentAnalyses = await redis.get(rateLimitKey);

if (recentAnalyses && parseInt(recentAnalyses) >= 5) {
  return res.status(429).json({
    status: 'error',
    message: 'Rate limit exceeded. Please try again later.',
  });
}

await redis.setex(rateLimitKey, 3600, (parseInt(recentAnalyses || '0') + 1).toString());
```

---

## Troubleshooting

### Issue: "OpenAI API key not found"

**Solution**:
1. Check Firestore: `settings/openai` document has `apiKey` field
2. Or set environment variable: `firebase functions:config:set openai.api_key="sk-..."`
3. Redeploy function after setting

### Issue: "Function timeout"

**Solution**:
1. Check image sizes (compress if too large)
2. Reduce max_tokens in OpenAI call
3. Increase timeout in function config (max 540s)

### Issue: "Invalid JSON response"

**Solution**:
1. Check OpenAI response in logs
2. Verify prompt instructs to return only JSON
3. Add better JSON extraction logic

### Issue: "CORS error"

**Solution**:
1. Ensure `cors: true` in function config
2. Add explicit CORS headers in function
3. Set `invoker: 'public'` in function config

---

## Deployment Checklist

- [ ] OpenAI API key configured
- [ ] Cloud Function deployed
- [ ] Frontend components built
- [ ] TypeScript types exported
- [ ] PDF conversion working
- [ ] Upload flow tested
- [ ] Analysis page tested
- [ ] Mobile responsive
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Logging configured
- [ ] Monitoring set up
- [ ] Cost tracking enabled
- [ ] Security measures in place
- [ ] Rate limiting configured
- [ ] User documentation written

---

## Support & Maintenance

### Regular Maintenance Tasks

1. **Weekly**
   - Check error logs
   - Monitor API costs
   - Review user feedback

2. **Monthly**
   - Update prompt based on user feedback
   - Optimize token usage
   - Review and update types
   - Check for OpenAI model updates

3. **Quarterly**
   - Comprehensive testing
   - Performance audit
   - Cost optimization review
   - UX improvements based on data

### Getting Help

- **Firebase Functions**: [Documentation](https://firebase.google.com/docs/functions)
- **OpenAI API**: [Documentation](https://platform.openai.com/docs)
- **TypeScript**: [Documentation](https://www.typescriptlang.org/docs)

---

**Last Updated**: 2025-11-14  
**Version**: 1.0  
**Status**: Production Ready

