# Project Progress Summary (Simple Terms)

*This document explains what we have built in non-technical terms. It is updated every time a new feature is completed.*

---

## 1. The Student Submission Portal (The Receiving Dock)
We built a public-facing web page where students can go to submit their hackathon projects. 
* **Features added:** A clean, dark-mode form where students enter their name, email, and team name. They can submit their code by either pasting a GitHub link or uploading a ZIP file. They do not need to create an account or log in.

## 2. The Organizer Dashboard (The Management Office)
We built the web interface for the hackathon organizers (the humans judging the event).
* **Features added:** A secure login system using GitHub OAuth. Once logged in, organizers have a dashboard with a sidebar navigation. We’ve built the "shell" for them to view their active hackathons, see past history, and look at a live leaderboard (though the leaderboard data will be filled in later).

## 3. The Database (The Storage Room)
We designed and built the entire database structure that will hold all the information.
* **Features added:** The system now knows how to safely store Organizations, Hackathons, Student Submissions, AI Report Cards, and Plagiarism (Similarity) flags.

## 4. The Background Queue (The Factory Floor Managers)
Code analysis takes time, so the website shouldn't freeze while the AI is thinking. 
* **Features added:** We built a background worker system. When a student submits code, it gets put into a waiting line (a queue). Our background workers automatically pick up the code, mark it as "Processing," and when finished, mark it as "Completed" or "Failed." We also built a separate, low-priority queue specifically for checking if students copied each other's code.

## 5. The Code Reader / Parser (The Sorting Machine)
We built the very first piece of the actual AI brain. Before we send code to ChatGPT/Claude, we need to quickly read it to understand its structure.
* **Features added:** We built a lightning-fast "parser" that can read code (currently TypeScript and Python). It automatically figures out if a file is a "database model", a "route", or a "utility". It also scans the code to find every function, class, and import, and calculates how complex the code is.

## 6. The Assembly Line Engine (LangGraph Pipeline)
We built the core engine that will move code through the 16 different evaluation steps.
* **Features added:** A state machine (using LangGraph) that tracks exactly where a student's code is in the process. It automatically moves the code from "Ingest" to "Parse" to "Dependency Graph", tracking any errors and progress along the way. We also wired this engine directly into our background factory workers so they run it automatically!

## 7. The First AI Reviewer (File-by-File Analysis)
We added the very first AI interaction to the pipeline. Now, the system sends chunks of code securely to Claude to get a foundational understanding of each file.
* **Features added:** An intelligent "Topological Sorter" that figures out which files don't depend on anything else, allowing the AI to read foundation files (like utilities or types) *before* the files that depend on them. The AI reviewer determines the core purpose, public API, dependencies, and immediate issues of each file. It's built with a robust retry system so that if Claude blips, it tries again, and if it completely fails on a batch, the pipeline logs an error and safely continues instead of crashing the whole report.

## 8. Full Brain Activation (Remaining AI Reviewers)
We completed the rest of the AI analysis pipeline, connecting 10 new advanced reviewers that work in sequence.
* **Features added:** 10 highly-specialized LangGraph nodes that run one after the other. These include reviewers for Architecture, Data Flow, Logic, Code Quality, Bug Hunting, Performance, and Design. 
* **Specialized Outputs:** We built a dedicated "Report Card" node that aggregates all previous reviews into a final grade (A+ to F), and a "Question Generator" node that crafts 20 specific interview questions based on the candidate's actual flaws for judges to use. Every node is protected by our robust retry and error-recovery wrappers to ensure the report always completes.

## 9. Leaderboard Rankings & Anti-Cheating (Cohort Ranking + Similarity Check)
We added two critical post-processing features that run after each report card is generated.
* **Cohort Ranking (Phase 15):** When a submission is part of a hackathon, the system re-calculates scores using the organizer's custom rubric weights (e.g., "Security matters 30% for this event"). It then ranks the student against every other completed submission in the same hackathon, computing their exact percentile. This powers the live leaderboard.
* **Plagiarism Detection (Phase 16):** After a report is delivered to the student, a separate background worker silently kicks off a plagiarism scan. It converts each student's code into a mathematical "fingerprint" (a vector embedding via OpenAI), then compares that fingerprint against every other submission in the hackathon. If two submissions are more than 70% similar, a flag is raised for the organizer to review. Crucially, this **never delays** the student's report — it runs completely in the background on its own queue.

## 10. The Command Center (Organizer Live Dashboard)
We built the main screen that organizers will stare at during the hackathon. It's a live, data-dense command center.
* **Live Leaderboard:** A sleek, dark-mode table that automatically updates via a live data stream (Server-Sent Events) as new submissions finish grading. It displays the team's rank, overall score, grade, and mini scores for the top categories.
* **Anti-Cheating Alerts:** Any submission flagged by our Plagiarism Detection (Phase 16) gets a glowing red "⚠️ Flagged" pill right on the leaderboard.
* **Instant Drill-Down:** Clicking on any team in the leaderboard instantly opens a detailed "Report Card Drill-Down" modal. Organizers can read the executive summary and see exactly *why* a team scored a 9.4 in Architecture (with specific strengths and weaknesses listed).
* **Export & Filters:** Organizers can instantly filter the leaderboard using a score slider (e.g., "only show teams above 8.5"), toggle to see only flagged submissions, and then hit "Export Shortlist (CSV)" to download the exact filtered list.

---

**Current Status:** The full 16-phase pipeline is now complete, and the Organizer Command Center is live and capable of streaming results in real-time. The core vision of an automated, enterprise hackathon grading platform is realized!
