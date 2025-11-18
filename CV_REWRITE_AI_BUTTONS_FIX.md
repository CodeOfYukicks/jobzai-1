# CV Rewrite AI Buttons Fix

## Problem
The AI action buttons (Rewrite, Improve Tone, Add Metrics, Make Senior, Keywords, Shorten) on the CV Rewrite page were not working properly.

## Root Causes Identified

### 1. Action ID Mismatch
The button component was sending action IDs like `'improve'`, `'metrics'`, `'senior'`, `'keywords'` but the AI service was checking for `'improve_tone'`, `'add_metrics'`, `'make_senior'`, `'insert_keywords'`.

**Files affected:**
- `src/lib/cvSectionAI.ts` - Switch statement wasn't matching the button IDs

### 2. Response Format Mismatch
The AI prompts were asking for plain text output, but the server was forcing JSON response format from OpenAI API, causing parsing issues.

**Files affected:**
- `src/lib/cvSectionAI.ts` - Prompts needed to request JSON format
- `server.cjs` - Needed better handling for cv-section-rewrite type
- `functions/index.js` - Same issue in Firebase Functions

## Changes Made

### 1. Fixed Action ID Matching (`src/lib/cvSectionAI.ts`)
Updated the switch statement to accept both old and new action IDs:
```typescript
case 'improve':
case 'improve_tone':
  // ...

case 'metrics':
case 'add_metrics':
  // ...

case 'senior':
case 'make_senior':
  // ...

case 'keywords':
case 'insert_keywords':
  // ...
```

### 2. Updated Prompts to Request JSON Format (`src/lib/cvSectionAI.ts`)
Changed the output format instruction to:
```typescript
## OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "content": "the improved section text here"
}
```

### 3. Improved Response Parsing (`src/lib/cvSectionAI.ts`)
Enhanced the content extraction logic to handle the JSON response properly:
```typescript
if (data.content && typeof data.content === 'object') {
  // OpenAI returns JSON object with 'content' field
  if (data.content.content) {
    content = data.content.content;
  } else {
    // Fallback to stringifying the whole object
    content = JSON.stringify(data.content);
  }
}
```

### 4. Added Type-Specific System Message (`server.cjs` and `functions/index.js`)
Added special handling for `cv-section-rewrite` type:
```javascript
if (type === 'cv-section-rewrite') {
  systemMessage = "You are an elite CV strategist specializing in ATS optimization and professional content enhancement. You analyze CV sections deeply and provide powerful, achievement-focused rewrites. Always respond with valid JSON in this exact format: {\"content\": \"the improved text\"}. Never include markdown code blocks or extra formatting.";
}
```

## Testing Instructions

### Prerequisites
1. Have an ATS analysis with CV rewrite already generated
2. Ensure server is running (`node server.cjs` or Firebase emulators)
3. Ensure OpenAI API key is configured

### Test Steps
1. Navigate to an analysis: `/ats-analysis/{id}/cv-rewrite`
2. Click on each AI button and verify:
   - **Rewrite**: Completely rewrites the section with better structure
   - **Improve Tone**: Makes language more senior and confident
   - **Add Metrics**: Emphasizes quantifiable achievements
   - **Make Senior**: Highlights leadership and strategic impact
   - **Keywords**: Integrates missing ATS keywords naturally
   - **Shorten**: Condenses while keeping impact
3. Each button should:
   - Show loading state ("AI is rewriting this section...")
   - Display a suggestion banner with the improved text
   - Allow accepting or discarding the suggestion
   - Update the content when accepted

### Expected Results
- ✅ All buttons trigger AI processing
- ✅ Suggestions appear in ~3-10 seconds
- ✅ Content quality is high and relevant
- ✅ No console errors
- ✅ Smooth UX with proper loading states

## Files Modified
1. `src/lib/cvSectionAI.ts` - Fixed action matching, prompts, and parsing
2. `server.cjs` - Added cv-section-rewrite type handling
3. `functions/index.js` - Added cv-section-rewrite type handling

## Technical Details

### API Flow
1. User clicks AI button → `EditorSectionCard.tsx`
2. Calls `handleAIAction` → `CVRewritePage.tsx`
3. Calls `rewriteSection` → `cvSectionAI.ts`
4. POST to `/api/chatgpt` → `server.cjs` or `functions/index.js`
5. OpenAI API call with GPT-4o
6. Response parsing and extraction
7. Display suggestion to user

### Prompt Engineering
Each action has a comprehensive, context-aware prompt that includes:
- Full CV context for better coherence
- Job description and company details
- ATS analysis insights (strengths, gaps, keywords)
- Specific instructions for the action type
- Critical rules to prevent hallucination
- Example transformations

## Notes
- The fix maintains backward compatibility with old action IDs
- All prompts follow zero-hallucination principles (no invented information)
- Response format is standardized across all endpoints
- Works in both development (server.cjs) and production (Firebase Functions)

