# Audit Scorecard

## Scoring Criteria (100 points total)

### Repository and Structure — 10 points

| Criterion | Points | Evidence Required |
|-----------|--------|-------------------|
| Correct repository (heidi-dang/pte-app) | 2 | GitHub URL matches specification |
| Correct branch for audit correction (fix/phase-a-audit-corrections) | 2 | Correction branch name matches specification |
| Clean structure | 2 | Directory layout matches specification |
| No secrets committed | 2 | No API keys, tokens, passwords or private keys |
| No unnecessary files | 2 | No generated, binary or dependency files |

### Requirements Completeness — 20 points

| Criterion | Points | Evidence Required |
|-----------|--------|-------------------|
| Complete product definition | 4 | Product requirements document covers vision, modules, launch scope, out-of-scope, success metrics |
| Complete role definition | 4 | All eight user roles defined with corrected permissions; free student routes accessible; content writer cannot publish; content reviewer cannot publish or retire without additional admin role |
| Complete routes | 4 | All planned routes documented with roles, purpose, loading, empty, error and mobile states; free student can access dashboard, courses, practice, progress, subscription and profile |
| Complete journey | 4 | Full student journey documented with stages, edge cases and recovery paths |
| Complete priorities | 4 | P0, P1 and P2 priorities with rationale |

### PTE Coverage and Accuracy — 15 points

| Criterion | Points | Evidence Required |
|-----------|--------|-------------------|
| All current task types documented | 5 | All 22 task types present in task manifest and blueprints |
| No missing interaction | 3 | Practice-mode and mock-mode differences documented per task |
| Practice and mock differences documented | 2 | Clear separation of official behaviour vs learning enhancements |
| Current tasks not labelled future or unofficial | 3 | Summarize Group Discussion and Respond to a Situation are current official tasks, not labelled as future or proposed |
| Official source register exists | 2 | Official PTE reference register documents all sources used |

### Content System — 15 points

| Criterion | Points | Evidence Required |
|-----------|--------|-------------------|
| Provenance | 3 | Content source, author, licence documented per item |
| Licensing | 3 | Permitted and prohibited content types defined |
| Review workflow | 3 | Complete content lifecycle from idea to publication |
| Publication gate | 3 | 9/10 minimum review score gate documented |
| Duplicate prevention | 3 | Automated validation detects duplicate content |

### Scoring and Calibration — 15 points

| Criterion | Points | Evidence Required |
|-----------|--------|-------------------|
| Estimated-score policy | 3 | Clear statement that scores are estimated training scores |
| Component evidence | 3 | Each result stores component-level evidence |
| Versioning | 3 | Scoring profiles and content are versioned and immutable |
| Confidence | 3 | Every result includes confidence range |
| Calibration | 3 | Calibration process defined with metrics; constrained vs open speaking tasks correctly separated |
| Integrated-skill contributions | 1 | Per-task skill contribution documented |

### UX and Recovery — 10 points

| Criterion | Points | Evidence Required |
|-----------|--------|-------------------|
| Autosave | 2 | Practice and writing autosave documented |
| Offline handling | 2 | Internet interruption behaviour documented; mock deadline continues during interruption |
| Progress states | 2 | Loading, empty and error states defined for all routes |
| Mobile requirements | 2 | Mobile viewport, touch targets and browser requirements defined |
| Recovery paths | 2 | Recovery from interruption, expiry and failure documented; mock timer recalculates remaining time on reconnection; no return to amount at interruption |

### Testing and Release Gates — 10 points

| Criterion | Points | Evidence Required |
|-----------|--------|-------------------|
| Test layers | 2 | Unit, integration, E2E and stability tests defined |
| Browser matrix | 1 | Browser compatibility matrix documented |
| Stability tests | 1 | Recovery and failure tests documented |
| Acceptance criteria | 2 | Measurable criteria for all major features; use configuration names |
| Documentation validator with tests | 2 | Validator covers all required checks; unit tests exist for validator |
| CI workflow | 2 | GitHub Actions workflow validates documentation on PR and push |

### Documentation Quality — 5 points

| Criterion | Points | Evidence Required |
|-----------|--------|-------------------|
| Clear | 1 | No ambiguous or vague language |
| Consistent | 1 | Terminology, formatting and style are consistent across all documents |
| No placeholders | 1 | No TODO, TBD, FIXME, INSERT HERE or COMING SOON |
| No contradictions | 1 | No conflicting requirements or policies; mock timer policy is consistent across documents |
| Valid links | 1 | All internal references are valid |

## Acceptance Threshold

**98/100** — The phase passes audit.

## Automatic Rejection Conditions

| Condition | Result |
|-----------|--------|
| Missing task type | Reject |
| Missing licence policy | Reject |
| Missing scoring disclaimer | Reject |
| Missing recovery requirement | Reject |
| Secrets committed | Reject |
| Branch not pushed | Reject |
| Validation failure | Reject |
| Unresolved placeholder | Reject |
| Contradictory requirements | Reject |
| Feature branch identical to main when work is meant for review | Reject |
| Current PTE task labelled future or unofficial | Reject |
| Incorrect current task interface | Reject |
| Missing official-source register | Reject |
| Contradictory route entitlements | Reject |
| Contradictory mock timing | Reject |
| Missing CI validation | Reject |
| Inaccurate completion report | Reject |
