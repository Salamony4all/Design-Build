# 🔧 Main Page Refactor Plan

## Problem Diagnosis

The chatbox appears small because:

1. **Parent containers** in lines 1110 and 1156 have `max-w-screen-xl` (1280px)
2. The page layout has **too many nested containers**
3. **Complex conditional rendering** makes it hard to control layout

Even though the chatbox itself has `style={{ maxWidth: '90%' }}`, it's being constrained by parent containers.

## Google Gemini's Actual Layout

```
┌─────────────────────────────────────────┐
│ Header (Logo, Menu)                     │ ← Fixed height
├─────────────────────────────────────────┤
│                                         │
│        Content Area (scrollable)        │ ← Flex-1
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │   Messages (if any)                 │ │
│ └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │      WIDE CHATBOX (80-90%)          │ │ ← Fixed bottom
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Refactor Strategy

### Step 1: Simplify Main Container

Remove all `max-w-*` constraints and use full-width layout:

```jsx
<div className="h-screen flex flex-col">
  <Header />
  <Content className="flex-1" />
  <Chatbox className="w-full" /> {/* No max-width! */}
</div>
```

### Step 2: Chatbox Wrapper

Only the chatbox itself should have max-width:

```jsx
// In the bottom chatbox area
<div className="w-full flex justify-center pb-6">
  <div style={{ width: '85%', maxWidth: '1400px' }}>
    <NanoPananaChat />
  </div>
</div>
```

### Step 3: Remove Conflicting Containers

Delete these constraints:

- Line 1110: `max-w-screen-xl`
- Line 1156: `max-w-screen-xl`

## Implementation

I'll create a clean, simple version that:

1. Uses full-width layout
2. Centers only the chatbox itself
3. Makes chatbox 85% screen width (max 1400px)
4. Removes all intermediate constraints
