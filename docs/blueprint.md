# **App Name**: Track-It Fencing

## Core Features:

- KPI Dashboard: Dashboard view that displays key performance indicators such as total hours, material costs, labor costs, and the top 5 most expensive jobs.
- Timer/Stopwatch: Timer to track work time. Uses a Start/Pause/Resume/Stop button set, as well as a Units Counter with increment/decrement buttons, Job selection, Task Type, notes, and photos.
- Offline data Synchronization: Store jobs' materials, sessions and costs. Calculates job materialCost, laborCost, overheadCost, and totalCost. If connection isn't available, the values will be stored and synchronized later.
- Material Catalog: Material Catalog stores item and automatically estimates job cost.
- AI Material Suggestion: Suggest most relevant Material Catalog items by using generative AI based on data in Firestore (Task type, materials previously used). LLM tool is used to enhance material search with synonyms.
- Report Generation: Generate customizable, savable, and exportable reports based on date ranges and different types of jobs and employees.
- Admin Features: Administration features to allow Admin users to invite and manage other users, update organization rates, and modify task types.

## Style Guidelines:

- Primary color: Forest green (#386641) to mirror natural wooden fences, which are central to the company's work.
- Background color: Light beige (#00008B), which will provide a neutral backdrop for a focus on function.
- Accent color: Terra cotta (#BC6C25), used sparingly for call-to-action elements and progress indicators. This should complement the forest green and add warmth without distracting from the primary function.
- Font: 'Inter' sans-serif for body and titles.
- Use line icons for tasks in the job tracker; these must be easily understandable. Examples: clock for session, toolbox for tools, documents for report, AI face for AI material suggestion.
- Use of whitespace and simple grid structures, responsive for mobile and desktop views.
- Use a smooth transition when timer status changes and a subtle loading animation when syncing data to the server.