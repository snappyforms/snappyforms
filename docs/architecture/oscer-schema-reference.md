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
| `household_data` | jsonb |  |

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
| `serialized_params` | jsonb |  |
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
| `serialized_params` | jsonb |  |
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
| `state` | jsonb |  |
| `lock_type` | integer |  |

### `good_job_batches`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `created_at` | datetime | required |
| `updated_at` | datetime | required |
| `description` | text |  |
| `serialized_properties` | jsonb |  |
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
| `value` | jsonb |  |
