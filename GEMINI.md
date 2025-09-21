# GEMINI.md

## Project Overview

This project is a React application built with Rsbuild. Its primary purpose is to demonstrate and compare different methods for implementing user interaction tracking (analytics/"埋点"). It showcases three distinct approaches:

1.  **Original Page**: A baseline page with no tracking.
2.  **Tracked Page**: A page with manually implemented tracking events using a custom tracking script and `IntersectionObserver` for visibility events.
3.  **Auto-Tracked Page**: A page with declarative tracking using `data-*` attributes, intended to be processed by an automated tracking script.

The application uses `react-router-dom` for navigation between these different pages.

## Project Structure

-   `rsbuild.config.ts`: The configuration file for Rsbuild, the build tool used in this project.
-   `package.json`: Defines project dependencies and scripts.
-   `public/tracking.js`: A simple mock tracking library that logs events to the console.
-   `src/index.tsx`: The entry point of the React application.
-   `src/App.tsx`: The main application component, which sets up the routing.
-   `src/OriginalPage.tsx`: A component representing a page without any tracking.
-   `src/TrackedPage.tsx`: A component demonstrating manual tracking implementation.
-   `src/AutoTrackedPage.tsx`: A component prepared for automatic tracking using data attributes.

## Running the Project

**Installation:**

```bash
pnpm install
```

**Development:**

Start the development server.

```bash
pnpm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

**Build:**

Build the application for production.

```bash
pnpm run build
```

**Preview:**

Preview the production build locally.

```bash
pnpm run preview
```

## Development Conventions

### Tracking Implementation

The project demonstrates three ways to handle tracking:

1.  **No Tracking** (`OriginalPage.tsx`): This page serves as a control group, with no tracking code.
2.  **Manual Tracking** (`TrackedPage.tsx`): This approach uses explicit function calls to a tracking library (`window.tracking`).
    -   **Impression Tracking**: Uses the `IntersectionObserver` API to detect when an element is visible in the viewport and sends a `show` event.
    -   **Click Tracking**: Calls the `click` method of the tracking library within the event handlers.
    -   **Dynamic Script Loading**: The tracking script is loaded dynamically only on this page to avoid unnecessary overhead.
3.  **Declarative Tracking** (`AutoTrackedPage.tsx`): This method uses `data-*` attributes (`data-track-show`, `data-track-click`) to declare tracking events directly in the JSX. This approach is designed to be used with a generic script that automatically finds and handles these attributes.

### Coding Style

-   The project is written in TypeScript and uses React with functional components and hooks.
-   Styling is done inline for simplicity, as the focus is on the tracking logic.
-   The code is formatted according to standard TypeScript and React conventions.
