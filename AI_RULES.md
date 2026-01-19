# AI Studio Application Rules

This document outlines the technical stack and guidelines for developing this application. Adhering to these rules ensures consistency, maintainability, and efficient development.

## Tech Stack Overview

*   **React:** The core library for building the user interface.
*   **TypeScript:** Used for type safety across the entire codebase, enhancing code quality and reducing bugs.
*   **Vite:** The build tool and development server, providing a fast and efficient development experience.
*   **Tailwind CSS:** A utility-first CSS framework for styling all components, ensuring a consistent and responsive design.
*   **Recharts:** A charting library for building interactive data visualizations, specifically used for the Pie Chart in the current application.
*   **Lucide React:** A collection of open-source icons, integrated for visual elements throughout the UI.
*   **shadcn/ui:** A collection of re-usable components built with Radix UI and Tailwind CSS. These components are available for use to accelerate UI development.
*   **No dedicated routing library:** The application currently operates as a single-page application without explicit routing.
*   **No dedicated state management library:** React's built-in `useState` and `useMemo` hooks are used for managing component state.

## Library Usage Rules

*   **UI Components:**
    *   **Prefer shadcn/ui:** For any new UI components, always check if a suitable component exists within the `shadcn/ui` library. This helps maintain a consistent look and feel and leverages pre-built, accessible components.
    *   **Custom Components:** If a required component is not available in `shadcn/ui` or needs highly specific functionality, create a new custom React component.
*   **Styling:**
    *   **Tailwind CSS ONLY:** All styling must be done using Tailwind CSS utility classes. Avoid writing custom CSS files or inline styles unless absolutely necessary for dynamic, calculated styles.
*   **Icons:**
    *   **Lucide React:** Use icons exclusively from the `lucide-react` library.
*   **Charting & Data Visualization:**
    *   **Recharts:** For any data visualization needs, `recharts` is the designated library.
*   **State Management:**
    *   **React Hooks:** Utilize React's built-in `useState`, `useReducer`, and `useContext` hooks for managing component and application state. Avoid introducing external state management libraries unless the complexity of the application explicitly demands it.
*   **Routing:**
    *   **Current State:** The application does not currently use a routing library. If routing becomes a requirement, `react-router-dom` would be the recommended choice.