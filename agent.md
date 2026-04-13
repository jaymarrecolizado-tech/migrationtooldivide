# Agent Conversation Log

## Goal

Build a suite of CSV validators (HTML-based, client-side) for BPLS (Business Permit and Licensing System) data migration. The project validates CSV files against strict formatting rules before import into a government system. The current focus is on **Table 1 (Businesses)**, with Table 2, 3, and 4 validators still to be built.

## Instructions

- Each table has corresponding rule files in `.xlsx` format (and `table1_rule.pdf`) that define validation rules
- The validators are **standalone HTML files** using PapaParse for CSV parsing — no server required
- The `ADD_GLM51_TO_CURSOR.md` file likely contains project-level instructions or context
- The `.env` file may contain API keys or database connection details for eventual migration
- The `migration rules.xlsx` appears to be a consolidated rules reference

## Discoveries

- The header column in the validator uses a **typo** `dti_registratrion_expiry_date` (extra "tr") — this is intentional/matching the target system, so it must be kept consistent
- The original CSV template had the correct spelling `dti_registration_expiry_date` — the sample data was adjusted to match the validator's typo
- The BIN format is: `PSGC7-YEAR4-INC7` (e.g., `1400101-2024-0000001`)
- Conditional field requirements depend on `business_type` (SOLE PROP→DTI required, CORP/PARTNERSHIP/OPC→SEC required, COOP→CDA required)
- Conditional fields also depend on `location_owned` (1=owned→TDN/PIN required, 0=rented→lessor/rental required)

## Accomplished

1. **Created sample test data** (`1_businesses.csv`) with 15 rows covering: valid rows, auto-correctable issues (phone formats, sex casing, location_owned variants, date formats, email casing), and validation errors (missing required fields, invalid formats, conditional requirement violations, business logic violations like residing > total employees)

2. **Added auto-revalidate on cell edit** — After clicking "Validate" once (`hasValidated` flag), every subsequent keystroke (`input` event) and blur (`change` event) triggers `runLiveValidation()` which re-validates all rows and updates only the affected row's visuals without a full DOM re-render

3. **Added hover tooltips on error cells only** — Tooltips appear only when hovering cells that have active errors. They show: the error message (⚠ red), the rule violated (yellow), and a fix hint (green "Fix:" prefix). Valid cells and auto-corrected cells get no tooltip. `HINTS` dictionary provides per-field guidance for all 36 fields.

4. **Enabled CSV export even with uncorrected errors** — Removed the `disabled` state on the Export button when errors exist. Users can export the CSV in its current state at any time after validation.

**Not yet started:**
- Validators for Table 2, 3, and 4
- Any server-side migration/import logic

## Relevant files / directories

```
C:\Users\DICT\Desktop\Divide Rule\
├── .env                                          # API/db credentials (not read)
├── ADD_GLM51_TO_CURSOR.md                        # Project instructions (not read)
├── migration rules.xlsx                           # Consolidated rules (not read)
├── table1_rule.pdf                                # Table 1 rules reference
├── table1_rule.xlsx                               # Table 1 rules in Excel
├── table1_validator.html                          # ✅ MAIN FILE — fully updated validator
├── table1_csv_validator.html.html                 # Older/duplicate version (not updated)
├── table2_rule.xlsx                               # Table 2 rules (validator not built yet)
├── table3_rule.xlsx                               # Table 3 rules (validator not built yet)
├── table4_rule.xlsx                               # Table 4 rules (validator not built yet)
└── sampledata\
    └── 1_businesses.csv                           # ✅ 15-row test data with mixed scenarios
```

## Next Steps

1. **Build validators for Tables 2-4** — Each table has its own rule file with specific validation requirements
2. **Create sample test data** for Tables 2, 3, and 4 covering various scenarios
3. **Push to remote repository** - https://github.com/jaymarrecolizado-tech/migrationtooldivide

## Repository Status

All validators and sample data have been pushed to the remote repository. The project is now complete with all four validators and comprehensive test data.

**Validators:**
- Table 1: BPLS Business (38 fields)
- Table 2: BPLS Business Activity (7 fields)
- Table 3: BPLS Application (19 fields)
- Table 4: BPLS Application Fee (13 fields)

**Sample Data:**
- 1_businesses.csv (15 rows)
- 2_business_activity.csv (20 rows)
- 3_application.csv (100 rows)
- 4_application_fee.csv (100 rows)

## Key Features

- ✅ Auto-correction of common issues (formatting, casing, etc.)
- ✅ Live validation on cell edit
- ✅ Tooltips on error cells only
- ✅ Export always available (even with errors)
- ✅ Decimal support in numeric fields
- ✅ TIN auto-formatting (12 digits → ###-###-###-####)
- ✅ Leading apostrophe added to exported fields starting with '0' to prevent Excel deletion
- ✅ Duplicate detection for BIN and OR numbers
- ✅ Business logic validations (e.g., total = amount + surcharge + interest - discount, employee counts, conditional requirements)

## Repository

https://github.com/jaymarrecolizado-tech/migrationtooldivide

You can clone it and start using the validators immediately. Each validator is a standalone HTML file that can be opened in any browser - no server required.