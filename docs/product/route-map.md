# Route Map

## Public Routes

| Route | Permitted Roles | Purpose | Primary Data | Loading State | Empty State | Error State | Mobile Requirements |
|-------|----------------|---------|-------------|--------------|-------------|-------------|--------------------|
| `/` | Guest, all | Marketing landing page | Marketing content | Skeleton loader | N/A | Fallback content | Responsive, touch navigation |
| `/about` | Guest, all | About the platform | Company info | Skeleton loader | N/A | Fallback content | Responsive layout |
| `/how-it-works` | Guest, all | Feature explanation | Feature content | Skeleton loader | N/A | Fallback content | Responsive layout |
| `/courses` | Guest, all | Course listing | Course catalog | Card skeleton grid | No courses message | Retry with error details | Single-column on mobile |
| `/pricing` | Guest, all | Subscription plans | Plan data | Card skeleton | N/A | Retry | Scrollable plan cards |
| `/free-diagnostic` | Guest | Free diagnostic entry | Diagnostic info | Skeleton | N/A | Auth redirect | Mobile-friendly form |
| `/blog` | Guest, all | Article listing | Blog posts | Card skeleton grid | No articles message | Retry | Single-column layout |
| `/support` | Guest, all | Help and support | FAQ and contact | Skeleton | N/A | Fallback | Accordion FAQ |
| `/terms` | Guest, all | Terms of service | Legal text | Skeleton | N/A | Fallback | Readable on mobile |
| `/privacy` | Guest, all | Privacy policy | Legal text | Skeleton | N/A | Fallback | Readable on mobile |

## Authentication Routes

| Route | Permitted Roles | Purpose | Primary Data | Loading State | Empty State | Error State | Mobile Requirements |
|-------|----------------|---------|-------------|--------------|-------------|-------------|--------------------|
| `/login` | Guest | User login | Auth form | Spinner | N/A | Form errors with field highlighting | Touch-friendly inputs |
| `/register` | Guest | User registration | Registration form | Spinner | N/A | Field-level validation errors | Touch-friendly inputs |
| `/verify-email` | Guest | Email verification | Verification token | Spinner | N/A | Token expired or invalid | Responsive |
| `/forgot-password` | Guest | Password reset request | Email form | Spinner | N/A | Email not found | Touch-friendly |
| `/reset-password` | Guest | Password reset | Token and new password | Spinner | N/A | Token expired or invalid | Touch-friendly |

## Student Routes

| Route | Permitted Roles | Purpose | Primary Data | Loading State | Empty State | Error State | Mobile Requirements |
|-------|----------------|---------|-------------|--------------|-------------|-------------|--------------------|
| `/app` | Free student, Paid student | App entry and redirect | User context | Full-page spinner | N/A | Redirect to login | Responsive shell |
| `/app/onboarding` | Free student | New-user onboarding | Onboarding state | Progress stepper | N/A | Step-specific error with retry | Touch-friendly stepper |
| `/app/dashboard` | Paid student | Main student dashboard | Progress, plan, recent activity | Dashboard skeleton widgets | Welcome state for new users | Widget-level error fallbacks | Card layout, swipeable |
| `/app/study-plan` | Paid student | Personalised study plan | Plan structure, progress | Plan skeleton | No plan message (needs diagnostic) | Regenerate option on error | Scrollable timeline |
| `/app/courses` | Paid student | Course listing | enrolled courses | Card skeleton grid | No courses message | Retry | Single-column cards |
| `/app/courses/[courseId]` | Paid student | Course detail and lessons | Course content, lessons | Course skeleton | N/A | Course not found | Accordion lessons |
| `/app/lessons/[lessonId]` | Paid student | Lesson content | Lesson data, progress | Lesson skeleton | N/A | Lesson not found, progress not saved | Responsive content |
| `/app/practice` | Paid student | Practice entry and selection | Question types, history | Card skeleton | Start practice prompt | Retry | Scrollable categories |
| `/app/practice/[questionType]` | Paid student | Practice by question type | Question, timer, input | Question skeleton | No questions available | Question load failure | Full-width input areas |
| `/app/practice/session/[sessionId]` | Paid student | Active practice session | Questions, timer, responses | Session skeleton | N/A | Session not found, expired, resume | Optimised for touch input |
| `/app/mock-tests` | Paid student | Mock exam listing | Available attempts, history | Card skeleton | No mocks available message | Retry | Scrollable list |
| `/app/mock-tests/[mockId]` | Paid student | Mock exam detail and start | Mock configuration | Skeleton | N/A | Mock not found | Touch-friendly start |
| `/app/mock-attempts/[attemptId]` | Paid student | Active or past mock attempt | Questions, timer, responses | Attempt skeleton | N/A | Attempt not found, expired, resume | Section-navigation optimised |
| `/app/results/[reportId]` | Paid student | Score report | Scores, breakdown, comparison | Report skeleton | N/A | Report not found | Scrollable report sections |
| `/app/mistakes` | Paid student | Mistake notebook | Mistake list, filters | List skeleton | No mistakes message, start practising prompt | Retry | Filterable list |
| `/app/vocabulary` | Paid student | Vocabulary notebook | Vocabulary list, review schedule | List skeleton | No vocabulary yet | Retry | Swipeable cards |
| `/app/progress` | Paid student | Detailed progress tracking | Charts, trends, history | Chart skeleton | Start practising prompt | Chart load failure | Scrollable with charts |
| `/app/teacher-feedback` | Paid student | Teacher review results | Feedback list | List skeleton | No feedback yet | Retry | List view |
| `/app/subscription` | Paid student | Manage subscription | Plan, status, payment history | Skeleton | N/A | Payment error with support link | Touch-friendly |
| `/app/profile` | Paid student | Edit profile | User data | Form skeleton | N/A | Save failure with retry | Touch-friendly form |

## Teacher Routes

| Route | Permitted Roles | Purpose | Primary Data | Loading State | Empty State | Error State | Mobile Requirements |
|-------|----------------|---------|-------------|--------------|-------------|-------------|--------------------|
| `/teacher` | Teacher | Teacher dashboard | Overview, assigned students | Dashboard skeleton | Welcome message | Retry | Responsive |
| `/teacher/students` | Teacher | Student list | Assigned students | Table skeleton | No students assigned | Retry | Searchable list |
| `/teacher/students/[studentId]` | Teacher | Student detail and progress | Student data, progress, submissions | Profile skeleton | N/A | Student not found | Scrollable profile |
| `/teacher/reviews` | Teacher | Pending and completed reviews | Review queue | List skeleton | No pending reviews | Retry | Filterable list |
| `/teacher/reviews/[reviewId]` | Teacher | Submit review | Response, rubric, feedback form | Review skeleton | N/A | Review not found, already completed | Touch-friendly form |
| `/teacher/assignments` | Teacher | Assignment management | Assignment list | List skeleton | No assignments | Retry | List view |
| `/teacher/assignments/[assignmentId]` | Teacher | Assignment detail and grading | Assignment data, student responses | Assignment skeleton | N/A | Assignment not found | Touch-friendly |

## Content Routes

| Route | Permitted Roles | Purpose | Primary Data | Loading State | Empty State | Error State | Mobile Requirements |
|-------|----------------|---------|-------------|--------------|-------------|-------------|--------------------|
| `/content` | Content writer, Content reviewer, Administrator | Content dashboard | Overview, queue | Skeleton | Welcome message | Retry | Responsive |
| `/content/questions` | Content writer, Content reviewer, Administrator | Question list | Question bank | Table skeleton | No questions | Retry | Filterable list |
| `/content/questions/new` | Content writer | Create new question | Question form | Form skeleton | N/A | Save failure with autosave recovery | Touch-friendly form |
| `/content/questions/[questionId]` | Content writer, Content reviewer, Administrator | Question detail and edit | Question data | Question skeleton | N/A | Question not found | Scrollable form |
| `/content/reviews` | Content reviewer, Administrator | Content review queue | Review queue | List skeleton | No pending reviews | Retry | Filterable list |
| `/content/sources` | Content writer, Content reviewer, Administrator | Source management | Source list | List skeleton | No sources | Retry | List view |
| `/content/assets` | Content writer, Content reviewer, Administrator | Asset library | Asset list, upload | Grid skeleton | No assets | Upload failure | Grid view |
| `/content/courses` | Content writer, Content reviewer, Administrator | Course content management | Course list | List skeleton | No courses | Retry | List view |

## Administration Routes

| Route | Permitted Roles | Purpose | Primary Data | Loading State | Empty State | Error State | Mobile Requirements |
|-------|----------------|---------|-------------|--------------|-------------|-------------|--------------------|
| `/admin` | Administrator, Super administrator | Admin dashboard | System overview, alerts | Dashboard skeleton | N/A | Retry | Responsive |
| `/admin/users` | Administrator, Super administrator | User management | User list | Table skeleton | No users | Retry | Searchable list |
| `/admin/teachers` | Administrator, Super administrator | Teacher management | Teacher list | Table skeleton | No teachers | Retry | Searchable list |
| `/admin/products` | Administrator, Super administrator | Product management | Product list | Table skeleton | No products | Retry | List view |
| `/admin/subscriptions` | Administrator, Super administrator | Subscription management | Subscription list | Table skeleton | No subscriptions | Retry | Searchable list |
| `/admin/mock-tests` | Administrator, Super administrator | Mock test management | Mock test list | Table skeleton | No mock tests | Retry | List view |
| `/admin/scoring` | Super administrator | Scoring profile management | Scoring profiles | Form skeleton | No profiles | Retry | Touch-friendly form |
| `/admin/jobs` | Administrator, Super administrator | Failed and running jobs | Job queue | Table skeleton | No jobs | Retry | Scrollable table |
| `/admin/settings` | Super administrator | Global settings | Settings form | Form skeleton | N/A | Save failure | Touch-friendly form |
| `/admin/feature-flags` | Super administrator | Feature flag management | Feature flags | List skeleton | No flags | Retry | Toggle list |
| `/admin/audit` | Administrator, Super administrator | Audit log | Audit events | Table skeleton | No events | Retry | Searchable list |
