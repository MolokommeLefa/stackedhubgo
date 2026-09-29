# StackedHub — risk register

Review every 2–3 days. Last reviewed: 29 Sep 2026.

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
| --- | --- | --- | --- | --- | --- |
| R1 | Brief says React Native + Kotlin; repo is a Vite web app | High | High | Confirm with lecturer that web is accepted. Role 2 already froze “no Android” for this slice. Do not start a second app unless required. | Role 1 |
| R2 | Backend lives on `Backend-database`, not `main` | High | High | Integrate against Role 2 contract locally (`http://127.0.0.1:5032`). Ask Role 2 to merge when stable. | Role 1 / 2 |
| R3 | Screens still use mock data even when API URL is set | High | High | Single data layer (`src/lib/data.ts`) for demo and live. | Role 1 |
| R4 | JWT in browser storage (not httpOnly cookies) | Medium | Medium | Session storage + 401 redirect for prototype; document limitation for security marks. | Role 1 / 2 |
| R5 | No CI/CD or hosted URLs | High | High (hosting rubric) | Frontend can still be demoed locally. Escalate Role 4 by 1 Oct. | Role 4 |
| R6 | Accessibility not built in | Medium | High (15 marks) | Labels, contrast, 44px targets, keyboard path before Day 10. | Role 1 |
| R7 | Nav pointed at missing `/users` and `/availability` | High | Medium | Add those routes (this sprint). | Role 1 |
| R8 | Silent blockers / no board | Medium | High | Daily stand-up notes in `docs/STANDUPS.md`. | Role 1 |
