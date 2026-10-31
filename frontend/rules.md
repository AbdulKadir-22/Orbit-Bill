# Frontend Rules

1. **Component Reusability:** Reuse existing components. Create reusable components instead of duplicating UI or logic.

2. **Feature-First Architecture:** Keep feature-specific components, services and pages inside `src/features/`. Keep shared UI components inside `src/components/ui/`.

3. **UI Design:** Strictly follow the existing monochrome Neo-Brutalism design system. Do not introduce unrelated colors, gradients, excessive animations or different design styles.

4. **States:** Every data-driven view must support proper loading, empty and error states. Never display fake, placeholder or hardcoded data as actual application data.

5. **Routing:** Use React Router for navigation. Use `NavLink` or appropriate router components instead of manual navigation or page reloads.

6. **API Integration:** Keep API calls inside feature-specific services. Use the shared API client from `src/lib/api.js`.

7. **Styling:** Use Tailwind CSS and maintain consistent spacing, typography, borders, shadows and responsive behaviour.

8. **Coding Standards:** Follow existing naming conventions. Keep code simple, readable and maintainable.

9. **No Unnecessary Code:** Avoid redundant components, abstractions, dependencies and comments. Do not add code without a clear purpose.

10. **Existing Code:** Inspect existing components and project structure before creating or modifying files. Reuse working implementations wherever possible.

11. **Responsiveness:** All screens must work properly on desktop, tablet and mobile.

12. **Consistency:** Do not independently redesign existing components. Maintain visual and functional consistency across the application.