🧹 [Code Health] Extract components from LeadForm.tsx to improve maintainability

🎯 **What:**
Extracted `ContactFallback` and `LeadFormFields` components from the main `LeadForm` function component.

💡 **Why:**
The original `LeadForm` was a long component that mixed business logic (handling submissions, tracking, and state) with a massive amount of presentational JSX (over 80 lines of form fields and fallback UI). By extracting the fallback contact info into `ContactFallback` and the form inputs into `LeadFormFields`, the main `LeadForm` component becomes significantly shorter and its business logic is much easier to read and maintain.

✅ **Verification:**
- Ran `npm run check` and verified there are no TypeScript or Astro errors.
- Ran `npm run test:run` and verified that all 51 tests pass.
- Verified that the form functionality (submit handling, state management, tracking) is fully preserved.

✨ **Result:**
A cleaner, more modular `LeadForm.tsx` where the main component is focused on logic, and the UI structure is cleanly separated into presentational sub-components.
