# AI Development Rules for BurgerHero

This document outlines the rules and conventions for the AI assistant to follow when developing the BurgerHero application. The goal is to maintain code consistency, quality, and predictability.

## Tech Stack Overview

The application is built with a modern, lightweight tech stack. Key technologies include:

*   **Framework:** React 19 with Vite for a fast development experience.
*   **Language:** TypeScript for type safety and improved developer experience.
*   **Styling:** Tailwind CSS for a utility-first styling approach, with a custom theming system using CSS variables.
*   **Routing:** React Router (`react-router-dom`) for all client-side navigation, configured with `HashRouter`.
*   **State Management:** Zustand for simple, scalable global state management (e.g., auth, theme).
*   **UI Components:** A custom-built component library in `src/components/ui` providing core elements like `Button`, `Card`, and `Input`.
*   **Icons:** `lucide-react` for a consistent and extensive set of icons.
*   **Forms:** `react-hook-form` for efficient and robust form handling.
*   **Animations:** `framer-motion` for smooth and declarative UI animations.
*   **Backend:** A mock API (`lib/fakeApi.ts`) using `localStorage` to simulate backend operations.

## Library Usage Rules

To ensure consistency, adhere to the following rules for using specific libraries:

1.  **Styling:**
    *   **Primary Method:** Always use Tailwind CSS utility classes for styling.
    *   **Theming:** For theme-dependent colors (based on the selected "Hero"), use the provided CSS variables: `bg-hero-primary`, `text-hero-primary`, `border-hero-primary`.
    *   **No New CSS:** Do not add new `.css` files or use styled-components/emotion. All styling should be inline via Tailwind classes.

2.  **Components:**
    *   **Use Existing:** Prioritize using the pre-built components from `src/components/ui`.
    *   **Create New:** If a new component is required, create it as a new file within `src/components/` and style it with Tailwind CSS, matching the existing design system.
    *   **No External Libraries:** Do not install third-party component libraries like Material-UI, Ant Design, or Chakra UI.

3.  **State Management:**
    *   **Global State:** Use Zustand for any state that needs to be shared across multiple components (e.g., user session, theme settings). New stores go in `src/store/`.
    *   **Local State:** Use React's built-in hooks (`useState`, `useReducer`) for state that is confined to a single component.

4.  **Icons:**
    *   **Lucide Only:** All icons must come from the `lucide-react` package. Do not use SVGs directly or install other icon libraries.

5.  **Forms:**
    *   **React Hook Form:** All forms, especially those requiring validation, must be implemented using `react-hook-form`.

6.  **API Calls:**
    *   **Centralized API:** All interactions with the data layer must be done through the functions exported from `lib/fakeApi.ts`. Do not call `localStorage` directly from components or pages.