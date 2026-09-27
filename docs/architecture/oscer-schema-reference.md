# OSCER schema reference

Every table and column in OSCER's Postgres database, generated from
[`reporting-app/db/schema.rb`](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/db/schema.rb) at commit `b1a7561` (schema version 2026-09-03).
The diagram is [`oscer-erd.svg`](oscer-erd.svg); the findings are in
[§11 of the architecture review](oscer-comparison.md#11-oscer-database-erd).

**Notes key:**
- **FK**: a foreign key that Postgres enforces.
- **REF**: an ID column with no constraint.
- **POLY**: a polymorphic type-and-ID pair.
- **VAL**: a link matched by value rather than by key.
- **PII**: sensitive personal data.

REF, POLY and VAL come from the model code, not the database. Column comments are OSCER's own.
Each JSON column has an example value: the field names come from the cited code, and the values are made up.
The last section explains [how that JSON shape is enforced](#how-json-shape-is-enforced).

## State input

### `certification_batch_uploads`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `filename` | string | required |
| `status` | string | required · default `"pending"` |
| `uploader_id` | uuid | **REF** → users (belongs_to :uploader) |
| `num_rows` | integer | required · default `0` |
| `num_rows_processed` | integer | required · default `0` |
| `num_rows_succeeded` | integer | required · default `0` |
| `num_rows_errored` | integer | required · default `0` |
| `results` | jsonb | default `{}` |
| `processed_at` | datetime |  |
| `created_at` | datetime | required |
| `updated_at` | datetime | required |
| `source_type` | string | default `"ui"` |
| `source_type::text <> 'ui'::text OR uploader_id IS NOT NULL` | check_constraint |  |

**Example `results` value.** Shape from [certification_batch_upload.rb:52-66](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/models/certification_batch_upload.rb#L52-L66). Empty after a normal run. Row counts live in their own columns.

*After a failed run*

```json
{
  "error": "All chunks failed to process"
}
```

### `certification_batch_upload_audit_logs`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `certification_batch_upload_id` | uuid | **FK** → `certification_batch_uploads` · required |
| `chunk_number` | integer | required |
| `status` | string | required · default `"started"` |
| `succeeded_count` | integer | default `0` |
| `failed_count` | integer | default `0` |
| `created_at` | datetime | required |
| `updated_at` | datetime | required |

### `certification_batch_upload_errors`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `certification_batch_upload_id` | uuid | **FK** → `certification_batch_uploads` · required |
| `row_number` | integer | required |
| `error_code` | string | required |
| `error_message` | string | required |
| `row_data` | jsonb |  |
| `created_at` | datetime | required |
| `updated_at` | datetime | required |

**Example `row_data` value.** Shape from [process_certification_batch_chunk_job.rb:63-86](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/jobs/process_certification_batch_chunk_job.rb#L63-L86), [csv_stream_reader.rb:36](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/services/csv_stream_reader.rb#L36). The failed CSV row, keyed by the upload template's column headers.

```json
{
  "member_id": "M-10423",
  "case_number": "C-5521",
  "member_email": "jane.doe@example.com",
  "first_name": "Jane",
  "last_name": "Doe",
  "application_date": "2025-09-01",
  "certification_type": "new_application",
  "date_of_birth": "1990-04-02",
  "work_hours": "85",
  "other_income_sources": ""
}
```

### `certification_origins`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `certification_id` | uuid | **REF** → certifications (unique index, no foreign key) · unique · required |
| `source_type` | string | required |
| `source_id` | uuid | **VAL** = certification_batch_uploads.id when source_type is batch_upload |
| `created_at` | datetime | required |
| `updated_at` | datetime | required |

### `external_activities`

Hours and/or gross income data from external sources (API/batch) for compliance calculation

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `member_id` | string | **VAL** matches certifications.member_id (text, no key) · required · Member reference - always required (no certification FK; the member's active certification is implicit) |
| `category` | string | required · Activity category: employment, community_service, education, unearned, or household (household income only) |
| `name` | string | Reported name of the school, organization, or person |
| `hours` | decimal | Hours worked/volunteered for the period; null when the row reports income only |
| `gross_income` | decimal | Gross income for the period; null when the row reports hours only |
| `period_start` | date | required · Activity period start date |
| `period_end` | date | required · Activity period end date |
| `source_type` | string | required · Source type: 'api' or 'batch_upload' |
| `source_id` | string | **VAL** = certification_batch_uploads.id, stored as a string · Source record ID (e.g., batch upload ID) |
| `reported_at` | datetime | required · When the external source reported this data |
| `metadata` | jsonb | required · default `{}` · Additional structured fields (e.g., employer name) |
| `origin_hash` | string | Fingerprint of the submission this row was split from; shared by every monthly row of one submission (not unique) |
| `created_at` | datetime | required |
| `updated_at` | datetime | required |
| `hours IS NOT NULL OR gross_income IS NOT NULL` | check_constraint |  |

**Example `metadata` value.** Shape from [external_activity_service.rb:81](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/services/external_activity_service.rb#L81).

```json
{
  "employer": "Riverside Food Bank"
}
```

### `external_hourly_activities` (legacy · read-only)

Hours data from external sources (API/batch) for compliance calculation

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `member_id` | string | **VAL** matches certifications.member_id · required · Member reference - always required |
| `category` | string | required · Activity category: employment, community_service, education |
| `hours` | decimal | required · Hours worked/volunteered (max 8760 = 365 days × 24 hours) |
| `period_start` | date | required · Activity period start date |
| `period_end` | date | required · Activity period end date |
| `source_type` | string | required · Source type: 'api' or 'batch_upload' |
| `source_id` | string | **VAL** = certification_batch_uploads.id · Source record ID (e.g., batch upload ID) |
| `created_at` | datetime | required |
| `updated_at` | datetime | required |
| `origin_hash` | string |  |
| `name` | string |  |

### `external_income_activities` (legacy · read-only)

Income data from external sources (API/batch/QWD) for compliance calculation

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `member_id` | string | **VAL** matches certifications.member_id · required · Member reference - always required (parallel to ExternalHourlyActivity; no certification FK) |
| `category` | string | required · Activity category: employment, community_service, education |
| `gross_income` | decimal | required · Gross income for the pay period |
| `period_start` | date | required · Pay period start date |
| `period_end` | date | required · Pay period end date |
| `source_type` | string | required · Source type: api, quarterly_wage_data, or batch_upload |
| `source_id` | string | **VAL** = certification_batch_uploads.id · Source record ID (e.g., batch upload ID) |
| `reported_at` | datetime | required · When the income data was reported |
| `metadata` | jsonb | required · default `{}` · Additional structured fields (e.g., employer name) |
| `created_at` | datetime | required |
| `updated_at` | datetime | required |
| `origin_hash` | string |  |
| `name` | string |  |

**Example `metadata` value.** Shape from [schema.rb:221](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/db/schema.rb#L221). Legacy table; same idea as external_activities.metadata.

```json
{
  "employer": "Riverside Food Bank"
}
```

## Certification and member forms

### `certifications`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `member_id` | text |  |
| `case_number` | text |  |
| `certification_requirements` | jsonb |  |
| `member_data` | jsonb | **PII** Holds SSN, date of birth, name, address and VA ICN as plain JSON |
| `created_at` | datetime | required |
| `updated_at` | datetime | required |
| `application_date` | date |  |
| `household_data` | jsonb | **PII** Holds household members' names, SSNs, dates of birth and incomes as plain JSON |

**Example `certification_requirements` value.** Shape from [requirements.rb:10-23](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/models/certifications/requirements.rb#L10-L23), [OSCER's API example](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/lib/assets/oas.json#L688). Staff region scoping reads region from here (certification.rb:27).

```json
{
  "certification_type": "new_application",
  "certification_period_start": "2025-04-01",
  "certification_period_end": "2025-09-30",
  "months_that_can_be_certified": [
    "2025-06-01",
    "2025-07-01",
    "2025-08-01"
  ],
  "number_of_months_to_certify": 1,
  "due_date": "2025-10-26",
  "region": "Southwest",
  "seasonal_worker": false,
  "self_employed": false,
  "params": {
    "lookback_period": 3,
    "number_of_months_to_certify": 1,
    "due_period_days": 30
  }
}
```

**Example `member_data` value.** Shape from [member_data.rb:137-167](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/models/certifications/member_data.rb#L137-L167), [OSCER's API example](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/lib/assets/oas.json#L688). The value object also defines older flags and date lists, such as dates_in_drug_treatment and dates_receiving_inpatient_medical_care, plus payroll_accounts.

```json
{
  "account_email": "john@doe.com",
  "contact": {
    "email": "john@doe.com",
    "phone": "+123456789"
  },
  "name": {
    "first": "Johnathan",
    "middle": "Alfred",
    "last": "Doe",
    "suffix": "Jr."
  },
  "ssn": "123456789",
  "date_of_birth": "1980-01-01",
  "address": {
    "street_line_1": "123 Main St",
    "street_line_2": null,
    "city": "Harrisburg",
    "state": "PA",
    "zip_code": "17101"
  },
  "va_icn": "1012345678V123456",
  "activities": [
    {
      "category": "community_service",
      "hours": "80",
      "period_start": "2025-08-01",
      "period_end": "2025-08-31",
      "employer": "Community Center",
      "verification_status": "verified"
    }
  ],
  "exemptions": [
    {
      "type": "medical_condition",
      "value": true,
      "verification_status": "verified",
      "periods": [
        {
          "period_start": "2025-06-01",
          "period_end": "2025-08-31"
        }
      ]
    }
  ],
  "race_ethnicity": "Hispanic",
  "currently_medically_frail": false
}
```

**Example `household_data` value.** Shape from [household_data.rb:7-54](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/models/certifications/household_data.rb#L7-L54).

```json
{
  "members": [
    {
      "name": {
        "first": "Maria",
        "last": "Doe"
      },
      "ssn": "987654321",
      "date_of_birth": "1984-03-12",
      "gross_incomes": [
        {
          "gross_income": "620.0",
          "period_start": "2025-08-01",
          "period_end": "2025-08-31"
        }
      ]
    }
  ]
}
```

### `certification_cases`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `certification_id` | uuid | **FK** → `certifications` · required |
| `status` | integer |  |
| `business_process_current_step` | string |  |
| `facts` | jsonb |  |
| `created_at` | datetime | required |
| `updated_at` | datetime | required |
| `verification_window_start_date` | date | The start date for the time a member is given to resolve a negative determination on their CE certification |
| `verification_window_end_date` | date | The end date for the time a member is given to resolve a negative determination on their CE certification |

**Example `facts` value.** Shape from [certification_case.rb:16-18](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/models/certification_case.rb#L16-L18). Keys appear once set. The same pair exists for exemption_request_* and denial_response_*.

```json
{
  "activity_report_approval_status": "approved",
  "activity_report_approval_status_updated_at": "2025-10-02T14:05:11.000Z"
}
```

### `activity_report_application_forms`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `created_at` | datetime | required |
| `updated_at` | datetime | required |
| `user_id` | uuid | **REF** → users (no constraint) |
| `status` | integer |  |
| `submitted_at` | datetime |  |
| `certification_case_id` | uuid | **FK** → `certification_cases` |
| `reporting_periods` | jsonb |  |

**Example `reporting_periods` value.** Shape from [activity_report_application_form.rb:14](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/models/activity_report_application_form.rb#L14), [year_month_attribute.rb:56-58](https://github.com/navapbc/strata-sdk-rails/blob/70d6869/app/lib/strata/attributes/year_month_attribute.rb#L56-L58).

```json
[
  "2025-07",
  "2025-08"
]
```

### `activities` (STI)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `activity_report_application_form_id` | uuid | **FK** → `activity_report_application_forms` · required |
| `month` | date |  |
| `hours` | decimal |  |
| `name` | string |  |
| `created_at` | datetime | required |
| `updated_at` | datetime | required |
| `type` | string |  |
| `income` | integer |  |
| `category` | string | required · default `"employment"` |
| `evidence_source` | string |  |

### `exemption_application_forms`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `user_id` | uuid | **REF** → users (no constraint) |
| `status` | integer |  |
| `submitted_at` | datetime |  |
| `exemption_type` | string |  |
| `created_at` | datetime | required |
| `updated_at` | datetime | required |
| `certification_case_id` | uuid | **FK** → `certification_cases` |

### `denial_response_application_forms`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `user_id` | uuid | **REF** → users (no constraint) |
| `status` | integer |  |
| `submitted_at` | datetime |  |
| `certification_case_id` | uuid | **REF** → certification_cases (indexed, no foreign key) |
| `comment` | text |  |
| `created_at` | datetime | required |
| `updated_at` | datetime | required |

## Workflow records (Strata SDK)

### `strata_tasks` (STI)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `type` | string |  |
| `description` | text |  |
| `status` | integer | default `0` |
| `assignee_id` | uuid | **REF** → users (User has_many :tasks) |
| `case_id` | uuid | **POLY** with case_type → certification_cases |
| `due_on` | date |  |
| `created_at` | datetime | required |
| `updated_at` | datetime | required |
| `case_type` | string | **POLY** with case_id → certification_cases |
| `application_form_id` | uuid | **REF** → the form table for the task type (Review*Task belongs_to) |
| `approval_status` | string |  |

### `strata_determinations`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `subject_id` | uuid | **POLY** with subject_type → certifications · required |
| `subject_type` | string | **POLY** with subject_id → certifications (only Certification includes Determinable) · required |
| `decision_method` | string | required |
| `outcome` | string | required |
| `determination_data` | jsonb | required · default `{}` |
| `determined_by_id` | uuid | **REF** → users; null when automated |
| `determined_at` | datetime | required |
| `created_at` | datetime | required |
| `reasons` | string[] | required · default `[]` |

**Example `determination_data` value.** Shape from [hours_based_determination_data.rb:17-49](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/models/determinations/hours_based_determination_data.rb#L17-L49), [hours_compliance_determination_service.rb:66-77](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/services/hours_compliance_determination_service.rb#L66-L77), [certification_case.rb:115-201](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/models/certification_case.rb#L115-L201). Four shapes, one per kind of decision.

*Hours-based compliance*

```json
{
  "total_hours": 84.5,
  "maximum_monthly_hours": 84.5,
  "hours_by_category": {
    "community_service": 80.0,
    "employment": 4.5
  },
  "hours_by_source": {
    "external": 80.0,
    "activity": 4.5
  },
  "external_hourly_activity_ids": [],
  "activity_ids": [
    "c83e5f19-0d27-4a9b-b6e4-7f2a1d8c3e05"
  ],
  "enrollment_status": null,
  "calculated_at": "2025-10-01T00:00:00Z"
}
```

*Exemption approved by staff*

```json
{
  "exemption_type": "medical_condition"
}
```

*Automated exclusion*

```json
{
  "exclusion_reasons": [
    "pregnancy_excluded"
  ],
  "data_source": "api"
}
```

*Denial response*

```json
{
  "denial_response_application_form_id": "9d4b2e71-5a6c-4f3e-8b20-1e7c9a4d6f52"
}
```

### `strata_audit_lines`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `action` | string | required |
| `subject_id` | uuid | **POLY** with subject_type |
| `subject_type` | string | **POLY** with subject_id → certifications or external_activities |
| `actor_id` | uuid | **POLY** with actor_type |
| `actor_type` | string | **POLY** with actor_id → users |
| `data` | jsonb | required · default `{}` |
| `created_at` | datetime | required |

**Example `data` value.** Shape from [tasks_controller.rb:31-37](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/controllers/tasks_controller.rb#L31-L37), [determinable.rb:74-78](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/models/concerns/determinable.rb#L74-L78), [external_activity_service.rb:84-88](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/services/external_activity_service.rb#L84-L88). The shape depends on the action. External-activity lines copy the whole row, member_id and income included.

*action: case.task_picked_up*

```json
{
  "task_id": "2f1c6a0e-8b1d-4e0f-9a51-3c2d7e8f9a10",
  "task_type": "ReviewActivityReportTask"
}
```

*action: case.activity_report.approved (any determination)*

```json
{
  "determination_id": "9d4b2e71-5a6c-4f3e-8b20-1e7c9a4d6f52"
}
```

*action: external_activity.create*

```json
{
  "id": "c83e5f19-0d27-4a9b-b6e4-7f2a1d8c3e05",
  "member_id": "M-10423",
  "category": "employment",
  "hours": "40.0",
  "gross_income": null,
  "period_start": "2025-08-01",
  "period_end": "2025-08-31",
  "source_type": "api",
  "source_id": null,
  "reported_at": "2025-09-02T10:00:00.000Z",
  "metadata": {
    "employer": "Riverside Food Bank"
  }
}
```

### `information_requests` (STI)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `type` | string | required |
| `application_form_id` | uuid | **POLY** with application_form_type · required |
| `application_form_type` | string | **POLY** with application_form_id → activity report or exemption form · required |
| `staff_comment` | text | required |
| `member_comment` | text |  |
| `due_date` | date | required |
| `created_at` | datetime | required |
| `updated_at` | datetime | required |

## People and files

### `users`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `uid` | string | unique · required |
| `provider` | string | required |
| `email` | string | required · default `""` |
| `mfa_preference` | integer |  |
| `created_at` | datetime | required |
| `updated_at` | datetime | required |
| `role` | string |  |
| `region` | string |  |
| `full_name` | string |  |

### `staged_documents`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `user_id` | uuid | **FK** → `users` · required |
| `stageable_type` | string | **POLY** with stageable_id → activities |
| `stageable_id` | uuid | **POLY** with stageable_type |
| `status` | string | required · default `"pending"` |
| `doc_ai_job_id` | string |  |
| `doc_ai_matched_class` | string |  |
| `extracted_fields` | jsonb | required · default `{}` |
| `validated_at` | datetime |  |
| `created_at` | datetime | required |
| `updated_at` | datetime | required |

**Example `extracted_fields` value.** Shape from [doc_ai_result.rb:75-81](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/models/doc_ai_result.rb#L75-L81), [payslip.rb:7-38](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/models/doc_ai_result/payslip.rb#L7-L38), [spec fixture](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/spec/helpers/activities_helper_spec.rb#L223). One entry per field Document AI read from a payslip, each with its confidence.

```json
{
  "payperiodstartdate": {
    "value": "2025-08-01",
    "confidence": 0.97
  },
  "payperiodenddate": {
    "value": "2025-08-15",
    "confidence": 0.96
  },
  "currentgrosspay": {
    "value": 1500.0,
    "confidence": 0.9
  },
  "currentnetpay": {
    "value": 1231.4,
    "confidence": 0.88
  },
  "employeename.firstname": {
    "value": "Jane",
    "confidence": 0.99
  }
}
```

## Framework tables

### `active_storage_attachments`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `name` | string | required |
| `record_type` | string | **POLY** with record_id → any model with attached files · required |
| `record_id` | uuid | **POLY** with record_type · required |
| `blob_id` | uuid | **FK** → `active_storage_blobs` · required |
| `created_at` | datetime | required |

### `active_storage_blobs`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `key` | string | unique · required |
| `filename` | string | required |
| `content_type` | string |  |
| `metadata` | text |  |
| `service_name` | string | required |
| `byte_size` | bigint | required |
| `checksum` | string |  |
| `created_at` | datetime | required |

### `active_storage_variant_records`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `blob_id` | uuid | **FK** → `active_storage_blobs` · required |
| `variation_digest` | string | required |

### `good_jobs`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `queue_name` | text |  |
| `priority` | integer |  |
| `serialized_params` | jsonb | ActiveJob's serialized job: job_class, job_id, queue_name, arguments, executions, enqueued_at |
| `scheduled_at` | datetime |  |
| `performed_at` | datetime |  |
| `finished_at` | datetime |  |
| `error` | text |  |
| `created_at` | datetime | required |
| `updated_at` | datetime | required |
| `active_job_id` | uuid |  |
| `concurrency_key` | text |  |
| `cron_key` | text |  |
| `retried_good_job_id` | uuid | **REF** → good_jobs |
| `cron_at` | datetime |  |
| `batch_id` | uuid | **REF** → good_job_batches |
| `batch_callback_id` | uuid | **REF** → good_job_batches |
| `is_discrete` | boolean |  |
| `executions_count` | integer |  |
| `job_class` | text |  |
| `error_event` | integer |  |
| `labels` | text[] |  |
| `locked_by_id` | uuid | **REF** → good_job_processes |
| `locked_at` | datetime |  |

### `good_job_executions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `created_at` | datetime | required |
| `updated_at` | datetime | required |
| `active_job_id` | uuid | **VAL** matches good_jobs.active_job_id · required |
| `job_class` | text |  |
| `queue_name` | text |  |
| `serialized_params` | jsonb | Same ActiveJob payload, copied per execution attempt |
| `scheduled_at` | datetime |  |
| `finished_at` | datetime |  |
| `error` | text |  |
| `error_event` | integer |  |
| `error_backtrace` | text[] |  |
| `process_id` | uuid | **REF** → good_job_processes |
| `duration` | interval |  |

### `good_job_processes`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `created_at` | datetime | required |
| `updated_at` | datetime | required |
| `state` | jsonb | GoodJob's heartbeat for a worker process (host, PID, scheduler state) |
| `lock_type` | integer |  |

### `good_job_batches`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `created_at` | datetime | required |
| `updated_at` | datetime | required |
| `description` | text |  |
| `serialized_properties` | jsonb | Batch properties. OSCER never uses GoodJob batches, so this table stays empty |
| `on_finish` | text |  |
| `on_success` | text |  |
| `on_discard` | text |  |
| `callback_queue_name` | text |  |
| `callback_priority` | integer |  |
| `enqueued_at` | datetime |  |
| `discarded_at` | datetime |  |
| `finished_at` | datetime |  |
| `jobs_finished_at` | datetime |  |

### `good_job_settings`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `created_at` | datetime | required |
| `updated_at` | datetime | required |
| `key` | text | unique |
| `value` | jsonb | GoodJob runtime settings, such as paused queues or disabled cron jobs |

## How JSON shape is enforced

Postgres checks nothing inside these columns. Ruby value objects define the shape, and only the API write path runs all of their rules.

**1. Database: no checks.** No jsonb column has a CHECK constraint or a JSON Schema. The only two CHECK constraints are on ordinary columns ([schema.rb:112](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/db/schema.rb#L112), [:191](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/db/schema.rb#L191)).

**2. Type conversion: lenient, and it runs on every read and write.** `certification_requirements`, `member_data` and `household_data` use a custom type that converts a Hash into a value object ([certification.rb:13-15](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/models/certification.rb#L13-L15), [json.rb:14-31](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/lib/active_model/type/json.rb#L14-L31)).
- **Unknown keys are dropped without an error** ([new_filtered.rb:14-23](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/lib/active_model/new_filtered.rb#L14-L23)). A misspelled `certifcation_type` disappears, and because a blank type is allowed ([requirements.rb:12-13](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/models/certifications/requirements.rb#L12-L13)) the record still saves.
- **A value that isn't a Hash becomes `nil`, also without an error** ([json.rb:30-31](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/lib/active_model/type/json.rb#L30-L31)). From reading the code (not run): an API client that sends `member_data` as a string gets a 201 with no `member_data`, because the request doesn't require it ([create_request.rb:9-13](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/models/api/certifications/create_request.rb#L9-L13)).
- **Bad dates get through the conversion.** ActiveModel turns an unparseable date into `nil` and passes non-strings through, so OSCER adds hand-written "must be a date" checks ([requirements.rb:48-61](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/models/certifications/requirements.rb#L48-L61), [create_request.rb:38-44](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/models/api/certifications/create_request.rb#L38-L44)).
- **Reads use the same conversion** ([json.rb:35](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/lib/active_model/type/json.rb#L35)), so a renamed key reads back as `nil` or its default.
- **Nava's own TODOs** call the approach barebones and name the `store_model` gem as an alternative ([as_json_attribute_type.rb:3](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/lib/active_model/as_json_attribute_type.rb#L3), [json.rb:3](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/lib/active_model/type/json.rb#L3)).

**3. Validation: runs only when something calls `valid?`.** Value objects validate their nested objects recursively ([value_object.rb:12](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/lib/value_object.rb#L12), [nested_attribute_validator.rb:37-42](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/lib/active_model/validations/nested_attribute_validator.rb#L37-L42)), including activity rules ([member_data.rb:64-75](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/models/certifications/member_data.rb#L64-L75)) and SSN format ([member_data.rb:139](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/models/certifications/member_data.rb#L139) → [tax_id_attribute.rb:50](https://github.com/navapbc/strata-sdk-rails/blob/70d6869/app/lib/strata/attributes/tax_id_attribute.rb#L50)). Saving a `Certification` only checks that `certification_requirements` is present ([certification.rb:19](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/models/certification.rb#L19)), so coverage depends on the write path:

| Write path | Nested rules run? |
|---|---|
| API `POST /api/certifications` | ✅ Yes. The request object is itself a value object, and an invalid request is rejected before a record is built ([create_request.rb:3-18](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/models/api/certifications/create_request.rb#L3-L18), [api/certifications_controller.rb:44-48](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/controllers/api/certifications_controller.rb#L44-L48)). |
| Batch CSV upload | 🟡 Requirements only ([certification_service.rb:57-70](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/services/certification_service.rb#L57-L70)). `member_data` is built from CSV columns after the CSV's own format checks, then saved ([batch_upload_record_validator.rb:55-61](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/services/batch_upload_record_validator.rb#L55-L61), [unified_record_processor.rb:86-115](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/services/unified_record_processor.rb#L86-L115)). |
| Staff edit (`PATCH /certifications/:id`) | ❌ Only the presence check. It accepts any keys under `member_data` and parses JSON pasted into the form ([certifications_controller.rb:41-64](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/controllers/certifications_controller.rb#L41-L64)), then calls `update` ([:18-19](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/controllers/certifications_controller.rb#L18-L19)). Any staff user can use it ([certification_policy.rb:20-21](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/policies/certification_policy.rb#L20-L21)). |

**4. Columns with no shape rules.**
- `certification_cases.facts`: `store_accessor` names the keys but not their types ([certification_case.rb:16-18](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/models/certification_case.rb#L16-L18)).
- `strata_determinations.determination_data`: Strata only checks that it is present ([determination.rb:35](https://github.com/navapbc/strata-sdk-rails/blob/70d6869/app/models/strata/determination.rb#L35)). In [issue #680](https://github.com/navapbc/oscer/issues/680) a JSON string passed that check, was stored double-encoded, and caused a 500 on the member dashboard. The fix was a code comment asking callers to pass a Hash ([certification_case.rb:194-201](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/models/certification_case.rb#L194-L201)).
- No model rules at all: `strata_audit_lines.data` ([audit_line.rb:19-21](https://github.com/navapbc/strata-sdk-rails/blob/70d6869/app/models/strata/audit_line.rb#L19-L21)), `certification_batch_uploads.results` ([certification_batch_upload.rb:15](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/app/models/certification_batch_upload.rb#L15)), `external_activities.metadata`, `staged_documents.extracted_fields` and `certification_batch_upload_errors.row_data`.
- Partial exception: Strata's `array: true` attributes validate each item on save, but skip items that aren't ActiveModel objects, per a TODO ([array_attribute.rb:79-99](https://github.com/navapbc/strata-sdk-rails/blob/70d6869/app/lib/strata/attributes/array_attribute.rb#L79-L99)).
- GoodJob's five jsonb columns belong to the gem and aren't covered here.

**5. API contract: tests only.** The OpenAPI spec is checked by `openapi_contracts`, a test-only gem ([Gemfile:158](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/Gemfile#L158), [rails_helper.rb:120](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/spec/rails_helper.rb#L120)). Nothing validates JSON against a schema at runtime.

**Conventions.** Nava's `.claude/rules` don't cover JSON shape. The only related line lists `app/models/api/` as "API request/response value objects" ([architecture.md:19](https://github.com/navapbc/oscer/blob/b1a7561/.claude/rules/architecture.md#L19)). The only migration that rewrites JSON contents is hand-written SQL: it moved `reporting_period` into the `reporting_periods` array ([migration 20251009164541:4-16](https://github.com/navapbc/oscer/blob/b1a7561/reporting-app/db/migrate/20251009164541_migrate_reporting_period_to_reporting_periods.rb#L4-L16)).
