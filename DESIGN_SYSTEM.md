# Flow OS Design System & Contributor Guide

**Philosophy**: "Million-Euro SaaS".
We prioritize minimalism, whitespace, and subtle interactions. Every screen should feel premium, calm, and focused.

## Core Principles
1.  **Whitespace is King**: Don't crowd content. Use `PageContainer` and `Section` to ensure breathing room.
2.  **Strict Typing**: We use TypeScript. No `any`.
3.  **Standard Components**: Do not hardcode input styles or cards. Use the UI library.

## Design Tokens (`app/globals.css`)

### Colors
Use CSS variables, do not hex-code directly.
-   **Primary Text**: `var(--color-primary)` (Deep Black/Zinc 950)
-   **Secondary Text**: `var(--color-secondary)` (Zinc 600)
-   **Brand Color**: `var(--color-brand)` (Electric Blue 600)
-   **Background**: `var(--color-background)` (Off-white/FBFBFB)
-   **Surface**: `var(--color-surface)` (Pure White)

### Typography
-   **Fonts**: Inter (via `var(--font-sans)`)
-   **Headings**: Use `h1`, `h2`, `h3` tags. They are pre-styled.
-   **Body**: `p` tag is pre-styled with relaxed leading.
-   **Labels**: Use `.pro-label` class or `ProInput` label prop.

## Component Library (`components/ui/`)

### 1. `PageContainer`
**Usage**: Wraps the entire content of a page.
```tsx
import { PageContainer } from "@/components/ui/PageContainer";

export default function MyPage() {
  return (
    <PageContainer>
       {/* Content */}
    </PageContainer>
  )
}
```

### 2. `Section`
**Usage**: The standard white card container.
```tsx
import { Section } from "@/components/ui/Section";

<Section>
  <h2>Title</h2>
  <p>Content</p>
</Section>
```

### 3. `ProInput` / `ProTextarea`
**Usage**: Standard form elements.
```tsx
import { ProInput } from "@/components/ui/ProInput";
import { Mail } from "lucide-react";

<ProInput
  label="Email Address"
  icon={Mail}
  placeholder="hello@example.com"
  value={email}
  onChange={...}
/>
```

## How to Create a New Page

1.  **Create File**: `app/my-feature/page.tsx`
2.  **Import Essentials**:
    ```tsx
    "use client";
    import { PageContainer } from "@/components/ui/PageContainer";
    import { PageHeader } from "@/components/PageHeader";
    import { Section } from "@/components/ui/Section";
    ```
3.  **Scaffold Structure**:
    ```tsx
    export default function MyFeaturePage() {
      return (
        <PageContainer>
          <PageHeader
            title="My Feature"
            breadcrumb={[{ label: 'Dashboard', href: '/' }, { label: 'Feature' }]}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Section>
              {/* Your content */}
            </Section>
          </div>
        </PageContainer>
      );
    }
    ```
4.  **Verify**: Ensure it aligns with the 1200px max-width and has consistent padding.
