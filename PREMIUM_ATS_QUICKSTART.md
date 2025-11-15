# Premium ATS Analysis - Quick Start Guide

## 🚀 Get Started in 15 Minutes

This quick start guide gets the Premium ATS Analysis system up and running ASAP.

---

## Prerequisites

- Firebase project set up
- OpenAI API key (GPT-4o access)
- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)

---

## Step 1: Deploy Cloud Function (5 minutes)

### 1.1 Configure OpenAI API Key

**Option A: Firestore (Recommended)**
```bash
# In Firebase Console, go to Firestore Database
# Create collection: settings
# Create document: openai
# Add field: apiKey (string) = sk-...
```

**Option B: Environment Variable**
```bash
firebase functions:config:set openai.api_key="sk-YOUR-API-KEY"
```

### 1.2 Deploy Function

```bash
cd functions
npm install
npm run build
firebase deploy --only functions:analyzeCVPremium
```

### 1.3 Test Function

```bash
# Get the function URL from deployment output
# Example: https://us-central1-your-project.cloudfunctions.net/analyzeCVPremium

# Test with curl
curl -X POST https://us-central1-your-project.cloudfunctions.net/analyzeCVPremium \
  -H "Content-Type: application/json" \
  -d '{
    "resumeImages": ["data:image/jpeg;base64,iVBORw0KGgo..."],
    "jobContext": {
      "jobTitle": "Senior Frontend Engineer",
      "company": "Apple",
      "jobDescription": "We are looking for..."
    },
    "userId": "test-user-123",
    "analysisId": "test-analysis-456"
  }'
```

✅ **Success**: You should receive a JSON response with the analysis.

---

## Step 2: Frontend Integration (10 minutes)

### 2.1 Install Dependencies

```bash
npm install pdfjs-dist
```

### 2.2 Create Analysis Service

Create `src/services/atsAnalysisService.ts`:

```typescript
export async function analyzeCVPremium(
  resumeImages: string[],
  jobContext: {
    jobTitle: string;
    company: string;
    jobDescription: string;
  },
  userId: string,
  analysisId: string
) {
  const response = await fetch(
    'https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/analyzeCVPremium',
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
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Analysis failed');
  }
  
  return await response.json();
}
```

### 2.3 Create PDF Converter

Create `src/utils/pdfConverter.ts`:

```typescript
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Set worker
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export async function convertPDFToImages(file: File): Promise<string[]> {
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
    
    const base64 = canvas.toDataURL('image/jpeg', 0.9);
    images.push(base64);
  }
  
  return images;
}
```

### 2.4 Create Simple Upload Component

Create `src/components/CVAnalysisUpload.tsx`:

```typescript
import { useState } from 'react';
import { convertPDFToImages } from '@/utils/pdfConverter';
import { analyzeCVPremium } from '@/services/atsAnalysisService';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function CVAnalysisUpload() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resumeImages, setResumeImages] = useState<string[]>([]);
  const [jobContext, setJobContext] = useState({
    jobTitle: '',
    company: '',
    jobDescription: '',
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    try {
      const images = await convertPDFToImages(file);
      setResumeImages(images);
    } catch (error) {
      console.error('Error converting PDF:', error);
      alert('Failed to convert PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!currentUser || !resumeImages.length) return;
    
    setLoading(true);
    try {
      const analysisId = crypto.randomUUID();
      
      const result = await analyzeCVPremium(
        resumeImages,
        jobContext,
        currentUser.uid,
        analysisId
      );
      
      console.log('Analysis complete:', result);
      
      // Redirect to analysis page
      navigate(`/ats-analysis/${analysisId}`);
    } catch (error) {
      console.error('Error analyzing CV:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">New ATS Analysis</h1>
      
      {/* Upload Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Upload Resume
        </label>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="block w-full"
        />
        {resumeImages.length > 0 && (
          <p className="text-green-600 mt-2">
            ✓ {resumeImages.length} pages uploaded
          </p>
        )}
      </div>
      
      {/* Job Context Section */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Job Title
          </label>
          <input
            type="text"
            value={jobContext.jobTitle}
            onChange={(e) => setJobContext({ ...jobContext, jobTitle: e.target.value })}
            placeholder="e.g., Senior Frontend Engineer"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Company
          </label>
          <input
            type="text"
            value={jobContext.company}
            onChange={(e) => setJobContext({ ...jobContext, company: e.target.value })}
            placeholder="e.g., Apple"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Job Description
          </label>
          <textarea
            value={jobContext.jobDescription}
            onChange={(e) => setJobContext({ ...jobContext, jobDescription: e.target.value })}
            placeholder="Paste the full job description here..."
            rows={8}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
      </div>
      
      {/* Submit Button */}
      <button
        onClick={handleAnalyze}
        disabled={loading || !resumeImages.length || !jobContext.jobTitle || !jobContext.company || !jobContext.jobDescription}
        className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Analyzing...' : 'Analyze My Resume'}
      </button>
    </div>
  );
}
```

---

## Step 3: Test End-to-End

### 3.1 Upload a Resume
1. Go to your app's analysis page
2. Upload a PDF resume
3. Verify it converts to images

### 3.2 Enter Job Details
1. Fill in job title
2. Fill in company
3. Paste job description

### 3.3 Submit Analysis
1. Click "Analyze My Resume"
2. Wait 30-60 seconds
3. Verify analysis is saved to Firestore
4. Check the analysis appears on the page

---

## Step 4: View Analysis (Build Display Page)

Create `src/pages/ATSAnalysisPage.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export function ATSAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !currentUser) return;
    
    const fetchAnalysis = async () => {
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'analyses', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setAnalysis(docSnap.data());
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
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!analysis) {
    return <div className="flex items-center justify-center min-h-screen">Analysis not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Hero Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              {analysis.match_scores.overall_score}%
            </h1>
            <p className="text-lg text-gray-600">
              {analysis.match_scores.category} Match
            </p>
          </div>
          <div className="text-right">
            <p className="font-medium">{analysis.jobTitle}</p>
            <p className="text-gray-600">{analysis.company}</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          {analysis.executive_summary}
        </p>
      </div>

      {/* Category Scores */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6">Match Breakdown</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Skills</span>
              <span className="font-semibold">{analysis.match_scores.skills_score}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${analysis.match_scores.skills_score}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Experience</span>
              <span className="font-semibold">{analysis.match_scores.experience_score}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${analysis.match_scores.experience_score}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Education</span>
              <span className="font-semibold">{analysis.match_scores.education_score}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${analysis.match_scores.education_score}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Industry Fit</span>
              <span className="font-semibold">{analysis.match_scores.industry_fit_score}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${analysis.match_scores.industry_fit_score}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Top Strengths */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6">Top Strengths</h2>
        <div className="space-y-4">
          {analysis.top_strengths?.map((strength: any, idx: number) => (
            <div key={idx} className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-green-900">{strength.name}</h3>
                <span className="text-green-700 font-semibold">{strength.score}%</span>
              </div>
              <p className="text-sm text-gray-700 mb-2">{strength.example_from_resume}</p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Why it matters:</span> {strength.why_it_matters}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Gaps */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6">Top Gaps</h2>
        <div className="space-y-4">
          {analysis.top_gaps?.map((gap: any, idx: number) => (
            <div key={idx} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-orange-900">{gap.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  gap.severity === 'High' ? 'bg-red-100 text-red-700' :
                  gap.severity === 'Medium' ? 'bg-orange-100 text-orange-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {gap.severity}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                <span className="font-medium">Why it matters:</span> {gap.why_it_matters}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">How to fix:</span> {gap.how_to_fix}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 48-Hour Action Plan */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6">48-Hour Action Plan</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">CV Edits</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {analysis.action_plan_48h?.cv_edits?.map((edit: string, idx: number) => (
                <li key={idx} className="text-sm">{edit}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Portfolio Items</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {analysis.action_plan_48h?.portfolio_items?.map((item: string, idx: number) => (
                <li key={idx} className="text-sm">{item}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">LinkedIn Updates</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {analysis.action_plan_48h?.linkedin_updates?.map((update: string, idx: number) => (
                <li key={idx} className="text-sm">{update}</li>
              ))}
            </ul>
          </div>
          
          {analysis.action_plan_48h?.message_to_recruiter && (
            <div>
              <h3 className="font-semibold mb-2">Message to Recruiter</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{analysis.action_plan_48h.message_to_recruiter}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## ✅ Verification Checklist

- [ ] Cloud Function deployed successfully
- [ ] OpenAI API key configured
- [ ] Function responds to test request
- [ ] PDF to images conversion working
- [ ] Upload component renders
- [ ] Job context form working
- [ ] Analysis submits successfully
- [ ] Analysis saved to Firestore
- [ ] Analysis displays on page
- [ ] All data fields populated

---

## 🎉 You're Done!

Your Premium ATS Analysis system is now live and functional!

**What you have**:
- ✅ Cloud Function that performs elite-level ATS analysis
- ✅ Frontend components for upload and display
- ✅ Firestore integration for data persistence
- ✅ Complete end-to-end flow

**Next steps**:
1. Test with real resumes and job descriptions
2. Refine the UI based on UX design guide
3. Add loading animations and polish
4. Implement advanced features (copy-to-clipboard, expandable sections, etc.)

For detailed implementation and design guidelines, see:
- **UX Design**: `PREMIUM_ATS_UX_DESIGN.md`
- **Implementation Guide**: `PREMIUM_ATS_IMPLEMENTATION.md`
- **Full Summary**: `PREMIUM_ATS_SUMMARY.md`

---

**Questions?** Review the comprehensive documentation or test the system end-to-end.

**Ready to launch!** 🚀

