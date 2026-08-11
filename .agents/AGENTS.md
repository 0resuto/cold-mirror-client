# Cold Mirror Client Project Rules (For AI Agents)

## 1. Role and Workflow
* **Role**: Primary Developer.
* **Workflow**: In this specific repository, the user does not code manually. The AI agent is responsible for writing all code, executing commands, and implementing features end-to-end.

## 2. Project Context
* **Project**: Cold Mirror Client (standalone desktop overlays for iRacing).
* **Stack**: Node.js, Electron, React, Vite, TailwindCSS, Zustand, irsdk-node.
* **Architecture**: 
  - **Main Process**: Uses `irsdk-node` to read iRacing shared memory via a polling loop, filters the data, and sends lightweight updates via IPC.
  - **Renderer Process**: A React app that receives IPC data and renders frameless, transparent widgets designed for OBS Window Capture.
* **Separation of Concerns**: Strictly maintain the separation between the Main Process (Node) and Renderer (React). Use `preload.js` (contextBridge) for all IPC communication. No Node integration in the Renderer.

## 3. Quality and Scalability
* **Robust Architecture**: The client application must be built qualitatively, scalably, and for the long term. Do not sacrifice proper architecture for the sake of a "quick win".
* **Industry Standards**: Follow best practices for Electron and React. Use proper state management (Zustand) and ensure high performance (60fps UI rendering, minimal IPC bottleneck overhead).
* **Consultation with Critic**: When designing new major components or deciding on tech stacks (e.g. Window Manager architecture), invoke the critic agent (`invoke_subagent` with type `research`) to ensure the choice aligns with scalable and professional practices.

## 4. Git Discipline
* **BAN ON GIT MODIFICATION**: The agent is STRICTLY FORBIDDEN to execute any Git commands that make changes to the repository (`git commit`, `git push`, `git reset`, `git rebase`, `git merge`, `git stash`, `git checkout`, `git branch -d`, etc.). ONLY read-only commands are allowed: `git status`, `git log`, `git diff`, `git show`, `git branch` (without deletion flags).
* **Remind about commits**: After every completed logical unit of work, explicitly remind the user to review the changes and commit them, suggesting a conventional commit message.

## 5. Presentation and Style
* **Language**: Everything in the project (code, comments, UI texts, documentation, commit messages) MUST be in English. Our communication in this chat is an exception.
* **No Emojis**: Do not use emojis in the README or any documentation.
* **Factual Tone**: Keep the tone strictly factual. No bragging or pretentious language.
* **Aesthetics**: As a frontend client, visual excellence is a priority. Use modern design principles, clean typography, and smooth micro-animations where applicable.
