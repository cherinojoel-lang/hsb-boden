============================================================
0. RESOLVED CONTEXT  (from session artifacts, 2026-09-03)
============================================================
Values below are taken from ABSCHLUSS_20260903.md, its independent
verification (ABSCHLUSS_20260903_VERIFIZIERT.md) and EINRICHTUNG_FINAL.md.
Each is marked with how strongly it is established. Re-verify anything
not marked VERIFIED before acting on it.

  GOLDEN_REFERENCE_FLOW   "HSB Outlook Draft Test" (flow ff3c...)
                          HISTORICAL: export of 23.08. shows exactly one
                          action, DraftEmail. No SendEmailV2 /
                          SendDraftEmail / Mail.Send. READ-ONLY baseline.
  DRAFT_ADAPTER_FLOW      second flow, HTTP trigger, from
                          HSB_Sales_OS_Draft_Adapter.zip
                          UNVERIFIED: export not locatable.
  MAILBOX_JOEL            j-cherino@HSB-Boden.de      HISTORICAL
  MAILBOX_JORDI           j-post@hsb-boden.de         pending own flow
  SHEET_ID_ALL_LEADS      1W-NjwEq0UhDo2TaeS-2qp_qit4YFMz6k-IqKHlPpHmg
                          VERIFIED: 6424 rows, 3212 Joel / 3212 Jordi.
  HANDOFF_DOC             Google Doc 1RrWbaMAo1r1_frcGj73SsUma_aBISNdFPAuy_pxnEdk
                          (28.08.) — architecture decision of record.
  ADAPTER_URL_PROPERTY    script property HSB_ADAPTER_URL_JORDI
                          (Joel equivalent set analogously)
  APPS_SCRIPT_PROJECT_ID  UNRESOLVED — script id was not retrievable via
                          the Drive connector. Recover it first.

  ENVIRONMENT             *** CONTRADICTION — RESOLVE BEFORE ANY OAUTH ***
                          EINRICHTUNG_FINAL.md instructs Jordi to authorize
                          in Default-8adbbf2e-..., explicitly "not
                          67d5e040-...". The 28.08. handoff names
                          67d5e040-... as the developer target and contains
                          the Jordi authorization link pointing there.
                          Do not send anyone an OAuth link until one
                          environment is established as canonical by live
                          readback. Authorizing in the wrong environment
                          creates a second broken connection.

  SOURCE OF CODE          The Sales OS engine and both flows exist in NO git
                          repository. Verified by search across
                          HSBHexagon/hsb-boden and cherinojoel-lang/hsb-boden.
                          The engine lives only in the Apps Script project.
                          => Phase A cannot be driven from git. Artifact
                          recovery is PHASE 0.

  CANONICAL WEBSITE REPO  HSBHexagon/hsb-boden (main, 2026-08-27).
                          cherinojoel-lang/hsb-boden is a SEPARATE, STALE
                          copy (main 2026-06-26, no shared history). Its
                          status documents describe a superseded state.
                          Never take project state from it.

============================================================
0b. PHASE 0 — BLOCKERS THAT PRECEDE PHASE A
============================================================
Source: independent verification, 2026-09-03.
Verdict on record: VERIFICATION_RESULT=FAIL_WITH_BLOCKERS,
SAFE_TO_CREATE_ONE_INTERNAL_DRAFT=NO, SAFE_TO_SEND_PROSPECT_EMAILS=NO,
PRODUCTION_READY=NO.

Do not create even ONE internal draft until all eight are freshly true:

  B1 ARTIFACTS_AVAILABLE=NO
     Ten named session files (adapter zip, .gs files, self-check, handoff,
     proof) are not locatable in Drive. Recover them or re-export the
     current Apps Script and flow state. Until then nothing is auditable.
  B2 FULL_TESTS_FRESH_GREEN=NO
     "25 tests green" and "258 tests" are historical claims with no fresh
     output. Re-run, capture the log.
  B3 FLOW_EXPORT_DRAFT_ONLY=NO
     Need a CURRENT export proving DraftEmail-only AND showing the HTTP
     trigger's authentication mode.
  B4 ENVIRONMENT_UNAMBIGUOUS=NO
     See the CONTRADICTION above. Flow, connection reference and target
     mailbox must all read back in one named environment.
  B5 JOEL_GATE_CONSISTENT=NO
     One Joel record is Versandfreigabe=yes with Legal_Basis=UNKNOWN.
     The AND-gate may still block it, but the data state is wrong.
     Clear it before any run.
  B6 REAL_TEMPLATE_TEXT=NO
     The only successful draft used placeholder text. The first real test
     must use the released template and exactly ONE internal recipient.
  B7 READBACK_VERIFIED=NO
     draftId, internetMessageId, conversationId, flyer attachment and the
     sheet write-back must all be read back, not reported.
  B8 REAL_EXTERNAL_PROSPECT_SEND_COUNT=0
     Must remain provably zero throughout.

  LEGAL GATE (independent of the technical gates):
     6204 of 6424 rows are Versandfreigabe=no; 6205 Legal_Basis=UNKNOWN.
     70 of the Joel review-100 are .ch domains — Swiss UWG Art. 3(1)(o)
     requires prior consent and is not satisfied by a German section 7(3)
     classification. Do NOT bulk-set EXISTING_CUSTOMER_7_3. Each contact
     needs a documented basis under the law that applies to it. This is a
     legal decision, not an engineering one.

  CONFLICTING INSTRUCTIONS:
     EINRICHTUNG_FINAL.md describes a daily routine that generates drafts
     for Joel and Jordi directly. That document predates the verification
     and must not be followed as an operating procedure. Where the two
     disagree, the verification governs.

============================================================
1. CLAUDE CODE EXECUTION CONTRACT
============================================================

You are operating as an implementation and verification agent.

Do not treat this prompt as proof of current system state.
Every statement under "KNOWN STATE" is a hypothesis or a prior
observation until freshly verified in this session.

Before mutations:

1.  Read repository/project instructions.
2.  Inspect current working tree.
3.  Inspect existing implementation.
4.  Inspect live external system state where tooling allows.
5.  Build CURRENT_STATE evidence.
6.  Compare against EXPECTED_STATE.
7.  State ONE root-cause hypothesis.
8.  Identify the smallest proving change.
9.  Perform only that change.
10. Run the proving check immediately.

Never:
- create parallel implementations without first locating the existing one
- silently replace working architecture
- assume historical screenshots or prior chat logs are current state
- trust a successful tool/agent message without independent verification
- broaden scope because a related best practice exists
- perform cleanup or refactoring during the root-cause fix
- execute a real-lead batch without fresh human authorization

When an external UI or API cannot be mutated by available tools, do not
simulate success. Return:

    HUMAN_ACTION_REQUIRED=YES
    EXACT_UI_PATH=
    EXACT_ACTION=
    EXPECTED_RESULT=
    PROVING_CHECK=

Then stop at that boundary.
A human-action requirement is not a failure. Inventing completion is.

============================================================
2. PRE-FLIGHT — READ BEFORE YOU BUILD
============================================================

Execute in order. Produce output for each step. Do not skip ahead.

1. Read CLAUDE.md / AGENTS.md / project instructions.
2. git status --short
3. Locate the CURRENT Apps Script adapter implementation
   (APPS_SCRIPT_PROJECT_ID, still UNRESOLVED). Report file + function names.
4. Locate existing Power Platform exports/config if present in repo.
5. Read the HANDOFF_DOC named in section 0.
6. Emit an evidence table: CURRENT vs EXPECTED state, one row per claim,
   each row marked VERIFIED_THIS_SESSION or UNVERIFIED.
7. Only then propose the minimal mutation.

Rationale: this prevents building a second parallel architecture beside
one that already exists.

============================================================
3. GIT BASELINE AND ROLLBACK
============================================================

Before changing repository files:

    git status --short
    git diff --stat
    git rev-parse HEAD

Record BASELINE_COMMIT=<sha>.

Do not overwrite unrelated user changes.
Do not reset, checkout, clean, or discard existing modifications.

After changes:

    git diff --check
    git diff
    <run relevant tests>

============================================================
4. ARCHITECTURE INVARIANTS — DO NOT VIOLATE
============================================================

- Root cause before fix. No symptom patching.
- The Golden Reference Flow "HSB Outlook Draft Test" is READ-ONLY.
  It is the comparison baseline, not a work surface.
- DraftEmail only. Zero send-capable actions on any path touched here.
- Apps Script remains the DOMAIN ENGINE (eligibility, lead state, business
  rules).
- Power Automate remains a thin ADAPTER. No business logic migrates into it.
- Fresh evidence before any PASS. A gate without an execution timestamp
  from this session is not a gate.
- Jordi's Home environment (see the ENVIRONMENT contradiction in section 0) is the known
  working mailbox boundary. Treat it as load-bearing.

============================================================
5. SCOPE FREEZE — THREE THINGS YOU MUST NOT "IMPROVE"
============================================================

--- 5.1 ALM / SOLUTION-AWARE FREEZE ---

Do NOT convert the working production path to solution-aware during this
fix, unless the current flow is ALREADY solution-aware, or the migration
can be proven independently without touching the working mailbox
connection.

Reason: a flow created outside a solution can retain its direct
connections when later added to one. Migrating those to connection
references is a separate change with its own failure surface.

Treat ALM conversion (solutions, connection references, environment
variables) as a SEPARATE HARDENING PHASE after operational closure.

--- 5.2 DATAVERSE SCOPE RULE ---

Dataverse may be used implicitly by Power Platform for:
- solutions
- flow metadata
- connection references
- environment variables
- flow run history

Dataverse is NOT the HSB sales CRM SSOT.

Do not create hsb_* CRM tables.
Do not migrate ALL_LEADS into Dataverse.
Do not duplicate eligibility or lead state in Dataverse.

Google Sheet SHEET_ID_ALL_LEADS (section 0) remains the operative business-data
SSOT. If you observe flow run history landing in Dataverse, that is
platform behaviour — it is NOT an invitation to move business data there.

--- 5.3 OUTLOOK CONNECTION PROTECTION ---

Distinguish two separate concerns and never conflate them:

    A) FLOW OWNERSHIP  (who owns/runs the flow)
    B) OUTLOOK CONNECTOR AUTHENTICATION  (whose mailbox is authenticated)

Do not replace Jordi's authenticated Outlook user connection with a
service principal, a managed identity, or any application-token identity
as part of this fix.

VERIFY-BEFORE-TOUCH RULE:
Service-principal support for the Office 365 Outlook connector is NOT
established for this project. Do not assume it is supported, and do not
assume it is unsupported. If any change would alter the mailbox
authentication identity, first produce first-party documentation or a
live tenant check proving the target auth mode is supported for THIS
connector, and record it as evidence. Absent that proof, the existing
user-authenticated connection stays exactly as it is.

If flow ownership is later moved to a service principal for ALM reasons,
that is a separate phase, and the Outlook connection must remain a
supported, working, user-authenticated connection through it.

============================================================
6. RETRY AND IDEMPOTENCY GATE
============================================================

A draft generator is duplicate-sensitive: an ambiguous timeout followed
by an automatic retry can produce duplicate drafts.

Inspect and REPORT, do not silently accept defaults:

    OUTLOOK_RETRY_POLICY=
    HTTP_TRIGGER_RETRY_POLICY=

Known platform default (verified against Microsoft Learn, Logic Apps
error/exception handling — the engine underlying cloud flows):
connector operations that support retry use an exponential policy,
up to 4 retries, intervals scaling by 7.5 s and capped between 5 s and
45 s, triggered on 408 / 429 / 5xx responses.
Confirm this still holds at execution time rather than quoting it.

Rules:
- Do not disable retries blindly.
- First determine whether the adapter has transaction-safe idempotency
  (a stable idempotency key per lead, checked before draft creation).
- If idempotency is NOT proven, classify automatic retry after an
  ambiguous timeout as a DUPLICATE_DRAFT_RISK and STOP before any batch
  execution.

Emit:

    IDEMPOTENCY_PROVEN=YES|NO
    IDEMPOTENCY_KEY_SOURCE=
    DUPLICATE_DRAFT_RISK=NONE|PRESENT

============================================================
7. PHASE A — VERIFY, BUILD, SELF-TEST
============================================================

Scope: everything technical, using test records only.

Gates (each requires a fresh execution timestamp from this session):

    REFERENCE_FLOW_CHANGED=NO
    SEND_CAPABLE_ACTION_COUNT=0
    JORDI_DRAFT_ADAPTER=PASS|FAIL
    GOOGLE_SHEETS_WRITE_TEST=PASS|FAIL
    JOEL_DRAFT_ADAPTER=PASS|FAIL
    IDEMPOTENCY_PROVEN=YES|NO

TECHNICAL_CLOSURE=PASS is permitted only when ALL of:

    REFERENCE_FLOW_CHANGED   == NO
    SEND_CAPABLE_ACTION_COUNT== 0
    JORDI_DRAFT_ADAPTER      == PASS
    GOOGLE_SHEETS_WRITE_TEST == PASS
    JOEL_DRAFT_ADAPTER       == PASS
    DUPLICATE_DRAFT_RISK     == NONE

On TECHNICAL_CLOSURE=PASS, emit:

    READY_FOR_BATCH=YES
    BATCH_EXECUTED=NO

Then STOP. Phase A ends here.

============================================================
8. PHASE B — PRODUCTION BATCH (SEPARATE AUTHORIZATION)
============================================================

The 50-record batch is a SEPARATE EXECUTION GATE.

You may never enter Phase B automatically from Phase A.

Do not create 50 real lead drafts unless the human explicitly authorizes
the batch in the current session, in this session's own words. Prior
authorization from an earlier session, from this prompt, or implied by
"continue" does not count.

If authorization is absent:

    BATCH_EXECUTED=NO
    BLOCKED_ON=HUMAN_AUTHORIZATION

============================================================
9. DEFINITION OF DONE
============================================================

Phase A done:

    TECHNICAL_CLOSURE=PASS
    READY_FOR_BATCH=YES
    BATCH_EXECUTED=NO

Phase B done (only after explicit authorization):

    BATCH_EXECUTED=YES
    DRAFTS_CREATED=<n>
    DUPLICATES_DETECTED=<n>
    SEND_EVENTS=0

OVERALL_STATUS is reported per phase. There is no single OVERALL_STATUS
that spans both. A green Phase A is not a green system.

============================================================
10. OUTPUT CONTRACT
============================================================

End every run with a flat, greppable block. No prose inside it.

    BASELINE_COMMIT=
    PHASE=A|B
    ROOT_CAUSE=
    MINIMAL_CHANGE=
    REFERENCE_FLOW_CHANGED=
    SEND_CAPABLE_ACTION_COUNT=
    JORDI_DRAFT_ADAPTER=
    GOOGLE_SHEETS_WRITE_TEST=
    JOEL_DRAFT_ADAPTER=
    OUTLOOK_RETRY_POLICY=
    HTTP_TRIGGER_RETRY_POLICY=
    IDEMPOTENCY_PROVEN=
    DUPLICATE_DRAFT_RISK=
    TECHNICAL_CLOSURE=
    READY_FOR_BATCH=
    BATCH_EXECUTED=
    HUMAN_ACTION_REQUIRED=
    UNVERIFIED_CLAIMS=

UNVERIFIED_CLAIMS must list every assertion you carried forward from this
prompt without independently verifying it this session. An empty list is
itself a claim — only emit it if it is true.
