create table locales (
	id varchar primary key,
	translations jsonb default '{}'::jsonb,
	created_at timestamptz default now(),
	created_by varchar,
	created_by_id varchar,
	updated_at timestamptz default now(),
	updated_by varchar,
	updated_by_id varchar
);
