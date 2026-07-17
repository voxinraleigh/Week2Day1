# MVP for Account Heat Map web application

## Business Requirements
- User can sign in
- When signed in, the user sees a board that has Accounts going down the left side, and Technology types going across the top
- Both the Accounts and Technologies can be renamed
- Accounts can be added and deleted
- Each account can have information entered into all the columns in its row for the technologies (e.g. AI Tools, AI Strategy, Data Governance, etc)
- allow creation and deletion of columns 
- entries within the technology fields for each account should allow for multiple entries to be added and deleted
- last column on the right should always be called "next steps"
- allow creation and deletion of accounts
- allow title of the board to be changed
- The Account row and all its information can be dragged and dropped to other rows
- The Technology columns can also be dragged and dropped to change their order
- Allow the columns to be sorted by right clicking on the column header
- Add a dialogue box for confirming deletion of rows and columns and entries

## Limitations
For the MVP, there will be a 5 users each with a username and password 
    User 1: username='HP',password='[HP123]'
    User 2: username='JFrog',password='[JFrog123]'
    User 3: username='Elastic',password='[Elastic123]'
    User 4: username='F5',password='[F5123]'
    User 5: username='1PW',password='[1PW123]'  
For the MVP, there will only be one heat map board for each user


## Technology Decisions
- NextJS frontend
- Python FastAPI backend, including serving the static NextJS site at /
- Everything packaged into a Docker Container
- Use "uv" as the package manager for python in the Docker Container
- Use SQLLite local database for the database, creating a new DB if it doesn't exist
- Start and Stop server scripts for Mac, PC, Linux in scripts/

## Starting Point
A working MVP of the frontend has already been built and is already in frontend.  This is not yet designed for docker setup, multi user or backend.  it's a front-end demo only with one user account.

## Color Scheme
- Accent Yellow: `#ecad0a` - accent lines, highlights
- Blue Primary: `#209dd7` - links, key sections
- Purple Secondary: `#753991` - submit buttons, important actions
- Dark Navy: `#032147` - main headings
- Gray Text: `#888888` - supporting text, labels

## Coding standards

1. Use latest versions of libraries and idiomatic approaches as of today
2. Keep it simple - NEVER over-engineer, ALWAYS simplify, NO unnecessary defensive programming. No extra features - focus on simplicity.
3. Be concise. Keep README minimal. IMPORTANT: no emojis ever
4. When hitting issues, always identify root cause before trying a fix. Do not guess. Prove with evidence, then fix the root cause.

## Working documentation

All documents for planning and executing this project will be in the docs/ directory.
Please review the docs/PLAN.md document before proceeding