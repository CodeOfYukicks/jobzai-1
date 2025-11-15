# Premium ATS Analysis UI - Visual Wireframes

## 🎨 Complete Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│                          HERO SECTION (Full Width)                            │
│                                                                               │
│  ← Back to Analyses                                                          │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                          │ │
│  │  [Company    Senior Frontend Engineer                      ┌─────────┐ │ │
│  │   Logo]      Acme Corp • San Francisco, CA                 │         │ │ │
│  │   [64px]     View job posting →                            │   85    │ │ │
│  │                                                             │  ─────  │ │ │
│  │  ┌─────────────────────────────────────────────┐          │  ╱   ╲  │ │ │
│  │  │ Your profile demonstrates excellent         │          │ │     │ │ │ │
│  │  │ alignment with this role. Strong React      │          │  ╲   ╱  │ │ │
│  │  │ expertise and design system experience      │          │   ───   │ │ │
│  │  │ match perfectly with their requirements...  │          │         │ │ │
│  │  └─────────────────────────────────────────────┘          │ [180px] │ │ │
│  │                                                             │ Strong  │ │ │
│  │                                                             └─────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────┬──────────────────────────────────────────────────────────┐
│                │                                                            │
│  SIDEBAR NAV   │                    MAIN CONTENT                           │
│  (Sticky)      │                                                            │
│                │                                                            │
│  ┌──────────┐  │  ══════════════════════════════════════════════════════  │
│  │          │  │                                                            │
│  │ Overview │  │  📊 Overview Stats                                        │
│  │          │  │  ┌────────┐ ┌────────┐ ┌────────┐                        │
│  ├──────────┤  │  │   85   │ │   4    │ │   3    │                        │
│  │          │  │  │ Score  │ │Strength│ │  Gaps  │                        │
│  │ Summary  │  │  └────────┘ └────────┘ └────────┘                        │
│  │          │  │                                                            │
│  ├──────────┤  │  ──────────────────────────────────────────────────────  │
│  │          │  │                                                            │
│  │Breakdown │  │  🎯 Job Summary                                           │
│  │          │  │  ┌─────────────────────────────────────────────────────┐ │
│  ├──────────┤  │  │ ROLE                                                 │ │
│  │          │  │  │ Lead frontend development and architecture           │ │
│  │Strengths │  │  │                                                      │ │
│  │    (4)   │  │  │ MISSION                                              │ │
│  │          │  │  │ Build scalable, accessible UI systems...             │ │
│  ├──────────┤  │  └─────────────────────────────────────────────────────┘ │
│  │          │  │                                                            │
│  │  Gaps    │  │  ┌──────────────────────┐ ┌──────────────────────┐      │
│  │   (3)    │  │  │ KEY RESPONSIBILITIES  │ │ CORE REQUIREMENTS    │      │
│  │          │  │  │ • Lead architecture   │ │ • React expertise    │      │
│  ├──────────┤  │  │ • Mentor team        │ │ • TypeScript        │      │
│  │          │  │  └──────────────────────┘ └──────────────────────┘      │
│  │ CV Fixes │  │                                                            │
│  │          │  │  ──────────────────────────────────────────────────────  │
│  ├──────────┤  │                                                            │
│  │          │  │  ✓ Match Breakdown                                        │
│  │  Action  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│  │          │  │  │  SKILLS  │ │   EXP    │ │   EDU    │                 │
│  ├──────────┤  │  │    88    │ │    90    │ │    75    │                 │
│  │          │  │  │ ███████░ │ │ █████████│ │ ██████░░ │                 │
│  │ Learning │  │  │ ✓ React  │ │ ✓ 5+ yrs │ │ ✓ B.S.  │                 │
│  │    (5)   │  │  │ ✗ GraphQL│ │ ✗ Team   │ │ ✗ M.S.  │                 │
│  │          │  │  └──────────┘ └──────────┘ └──────────┘                 │
│  ├──────────┤  │                                                            │
│  │          │  │  ──────────────────────────────────────────────────────  │
│  │   Fit    │  │                                                            │
│  │          │  │  ⭐ Top Strengths                                         │
│  └──────────┘  │  ┌─────────────────────┐ ┌─────────────────────┐        │
│                │  │ 🎯 React Expertise  │ │ 🎯 Design Systems   │        │
│                │  │           [95]      │ │           [92]      │        │
│                │  │                     │ │                     │        │
│                │  │ "Built design..."   │ │ "Created library..."│        │
│                │  │                     │ │                     │        │
│                │  │ WHY IT MATTERS      │ │ WHY IT MATTERS      │        │
│                │  │ This role needs...  │ │ They're building... │        │
│                │  └─────────────────────┘ └─────────────────────┘        │
│                │                                                            │
│                │  ──────────────────────────────────────────────────────  │
│                │                                                            │
│                │  ⚠️ Gaps to Address                                        │
│                │  ┌─────────────────────┐ ┌─────────────────────┐        │
│                │  │ ⚠️ Next.js         │ │ ⚠️ GraphQL          │        │
│                │  │      [Medium]       │ │      [High]         │        │
│                │  │                     │ │                     │        │
│                │  │ WHY IT MATTERS      │ │ WHY IT MATTERS      │        │
│                │  │ Team uses Next...   │ │ All APIs use...     │        │
│                │  │                     │ │                     │        │
│                │  │ 💡 HOW TO FIX       │ │ 💡 HOW TO FIX       │        │
│                │  │ Add a project...    │ │ Take Apollo...      │        │
│                │  └─────────────────────┘ └─────────────────────┘        │
│                │                                                            │
│                │  ──────────────────────────────────────────────────────  │
│                │                                                            │
│                │  📝 CV Fixes Panel                                        │
│                │  ┌─────────────────────────────────────────────────────┐ │
│                │  │ 📈 POTENTIAL GAIN: +12 POINTS                        │ │
│                │  └─────────────────────────────────────────────────────┘ │
│                │                                                            │
│                │  ▼ High-Impact Bullets to Add (3)                         │
│                │  ┌─────────────────────────────────────────────────────┐ │
│                │  │ 1. Add metric about design system adoption           │ │
│                │  │ 2. Quantify performance improvements                  │ │
│                │  │ 3. Mention team size and leadership                  │ │
│                │  └─────────────────────────────────────────────────────┘ │
│                │                                                            │
│                │  ▶ Bullets to Rewrite (2)                                 │
│                │  ▶ Keywords to Insert (4)                                 │
│                │  ▶ Sections to Reorder (1)                                │
│                │                                                            │
│                │  ──────────────────────────────────────────────────────  │
│                │                                                            │
│                │  ⏱️ 48-Hour Action Plan                                    │
│                │  ┌─────────────────────────────────────────────────────┐ │
│                │  │ 📝 CV EDITS                                          │ │
│                │  │   1. Update experience with metrics                  │ │
│                │  │   2. Add Next.js project                            │ │
│                │  │                                                      │ │
│                │  │ 💼 PORTFOLIO                                          │ │
│                │  │   1. Create Next.js demo                            │ │
│                │  │                                                      │ │
│                │  │ 💬 MESSAGE TO RECRUITER                               │ │
│                │  │ ┌─────────────────────────────────────────────────┐ │ │
│                │  │ │ Hi [Name],                                       │ │ │
│                │  │ │ I noticed your posting for...                   [📋]│ │
│                │  │ └─────────────────────────────────────────────────┘ │ │
│                │  └─────────────────────────────────────────────────────┘ │
│                │                                                            │
│                │  ──────────────────────────────────────────────────────  │
│                │                                                            │
│                │  🎓 Learning Path                                         │
│                │  "Master Next.js and GraphQL to strengthen candidacy"     │
│                │                                                            │
│                │  ┌─────────────────┐ ┌─────────────────┐                │
│                │  │ 📹 VIDEO        │ │ 📚 COURSE       │                │
│                │  │ Next.js Crash   │ │ GraphQL Master  │                │
│                │  │                 │ │                 │                │
│                │  │ Covers SSR...   │ │ Learn Apollo... │                │
│                │  │ Open → 🔗       │ │ Open → 🔗       │                │
│                │  └─────────────────┘ └─────────────────┘                │
│                │                                                            │
│                │  ──────────────────────────────────────────────────────  │
│                │                                                            │
│                │  🎯 Opportunity Fit                                       │
│                │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│                │  │ ✅ SUCCESS  │ │ ⚠️ RISKS    │ │ 🛡️ MITIGATE │       │
│                │  │             │ │             │ │             │       │
│                │  │ • Strong    │ │ • Limited   │ │ • Take      │       │
│                │  │   React     │ │   Next.js   │ │   course    │       │
│                │  │ • Design    │ │ • No        │ │ • Build     │       │
│                │  │   systems   │ │   GraphQL   │ │   project   │       │
│                │  └─────────────┘ └─────────────┘ └─────────────┘       │
│                │                                                            │
└────────────────┴──────────────────────────────────────────────────────────┘
```

---

## 📱 Mobile View (< 768px)

```
┌─────────────────────────────┐
│                             │
│     HERO (Stacked)          │
│                             │
│  ← Back                     │
│                             │
│  [Logo] Senior Frontend     │
│         Acme Corp           │
│                             │
│  ┌────────────────────┐    │
│  │                    │    │
│  │       [85]         │    │
│  │      ─────         │    │
│  │     ╱   ╲         │    │
│  │    │     │        │    │
│  │     ╲   ╱         │    │
│  │      ───          │    │
│  │                    │    │
│  │  Strong Match      │    │
│  └────────────────────┘    │
│                             │
│  ┌────────────────────┐    │
│  │ Executive summary  │    │
│  │ text...           │    │
│  └────────────────────┘    │
│                             │
├─────────────────────────────┤
│                             │
│  NO SIDEBAR (Hidden)        │
│                             │
│  All sections stacked       │
│  vertically:                │
│                             │
│  📊 Stats                   │
│  🎯 Job Summary             │
│  ✓ Match Breakdown          │
│  ⭐ Strengths (full width)  │
│  ⚠️ Gaps (full width)       │
│  📝 CV Fixes                │
│  ⏱️ Action Plan             │
│  🎓 Learning                │
│  🎯 Fit                     │
│                             │
└─────────────────────────────┘
```

---

## 🎨 Component Anatomy

### Strength Card
```
┌──────────────────────────────────────┐
│                                      │
│  🎯 React Expertise          [95]   │  ← Name + Score badge
│                                      │
│  ┌────────────────────────────────┐ │
│  │ "Built a design system used   │ │  ← Resume quote (monospace)
│  │  by 50+ engineers"            │ │
│  └────────────────────────────────┘ │
│                                      │
│  WHY IT MATTERS                      │  ← Label
│  This role requires deep React      │  ← Explanation
│  knowledge for building...          │
│                                      │
└──────────────────────────────────────┘
   │                                │
   └────────── Hover State ─────────┘
   Lifts up 4px + shadow increase
```

### Gap Card
```
┌│─────────────────────────────────────┐
││                                     │
││ ⚠️ Next.js Experience    [Medium]  │  ← Name + Severity
││                                     │
││ WHY IT MATTERS                      │
││ The team uses Next.js for SSR...   │
││                                     │
││ ┌─────────────────────────────────┐│
││ │ 💡 HOW TO FIX                  ││  ← Fix suggestion (highlighted)
││ │ Add a bullet about SSR...      ││
││ └─────────────────────────────────┘│
│└─────────────────────────────────────┘
│← Left border color (severity)
```

### CV Fixes Header
```
┌────────────────────────────────────────────┐
│                                            │
│  📈  POTENTIAL SCORE IMPROVEMENT           │  ← Gradient background
│                                            │
│      +12 points                            │  ← Big number
│                                            │
│  By implementing these CV improvements,    │  ← Description
│  you could significantly increase...       │
│                                            │
└────────────────────────────────────────────┘
```

### Collapsible Section
```
┌────────────────────────────────────────────┐
│ 📝 High-Impact Bullets to Add  [3]    [▼] │  ← Header (clickable)
├────────────────────────────────────────────┤
│                                            │
│  ┌─┬────────────────────────────────┬──┐ │
│  │1│ Add quantified metrics about   │📋│ │  ← Item with copy button
│  └─┴────────────────────────────────┴──┘ │
│                                            │
│  ┌─┬────────────────────────────────┬──┐ │
│  │2│ Include leadership experience  │📋│ │
│  └─┴────────────────────────────────┴──┘ │
│                                            │
└────────────────────────────────────────────┘
```

### Score Donut
```
        ┌─────────┐
        │         │
        │   85    │  ← Animated from 0→85
        │  ─────  │
        │ ╱     ╲ │  ← Gradient stroke
        ││       ││     (color = category)
        │ ╲     ╱ │
        │  ─────  │
        │         │
        │ Strong  │  ← Category badge
        └─────────┘
```

---

## 🎭 Interaction States

### Card Hover
```
Normal:                    Hover:
┌──────────────┐          ┌──────────────┐
│              │          │              │  ↑ -4px
│   Content    │    →     │   Content    │  🌟 shadow
│              │          │              │
└──────────────┘          └──────────────┘
```

### Copy Button
```
Idle:      Hover:       Clicked:      Reset:
[📋]   →   [📋]     →    [✓]      →   [📋]
         (visible)    (green)       (2s later)
```

### Section Navigation
```
Inactive:              Active:
┌──────────────┐      ┌──────────────┐
│  Strengths   │  →   │→ Strengths ← │
└──────────────┘      └──────────────┘
  gray text            indigo bg + text
```

---

## 🌈 Color System Visual

### Score Categories
```
Excellent (90-100)    Strong (75-89)     Medium (60-74)     Weak (0-59)
┌───────────────┐    ┌──────────────┐   ┌──────────────┐   ┌─────────────┐
│ 🟢 Emerald    │    │ 🔵 Blue      │   │ 🟡 Amber     │   │ 🔴 Rose     │
│ #10B981       │    │ #3B82F6      │   │ #F59E0B      │   │ #F43F5E     │
└───────────────┘    └──────────────┘   └──────────────┘   └─────────────┘
```

### Severity Badges
```
High              Medium             Low
┌─────────┐      ┌─────────┐       ┌─────────┐
│ 🔴 Rose │      │ 🟡 Amber│       │ 🔵 Blue │
└─────────┘      └─────────┘       └─────────┘
```

---

## 📐 Spacing Scale

```
Element             Spacing    Pixels
─────────────────────────────────────
Section gap         space-y-16  64px
Card gap            gap-6       24px
Card padding        p-6         24px
Element gap         space-y-4   16px
Small gap           gap-3       12px
Tight gap           gap-2       8px
Icon gap            gap-2       8px
```

---

## 🎬 Animation Timeline

```
Page Load:
0ms    → Hero fade in
100ms  → Donut animation start (0→85 over 700ms)
200ms  → First strength card (stagger)
250ms  → Second strength card
300ms  → Third strength card
800ms  → Donut animation complete
```

---

## 🎯 Information Hierarchy

```
Level 1: Hero (Job Title + Score)
         ↓
Level 2: Section Titles (Job Summary, Strengths, etc.)
         ↓
Level 3: Card Titles (Individual strength names)
         ↓
Level 4: Body Text (Descriptions, explanations)
         ↓
Level 5: Metadata (Labels, badges, counts)
```

---

This wireframe document provides a complete visual reference for the premium ATS analysis UI system.

