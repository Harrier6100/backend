create table workflow_templates (
    id serial primary key,
    name varchar,
    visibility varchar default 'private',
    steps jsonb,
    is_active boolean default true,
    created_at timestamptz default now(),
    created_by varchar,
    created_by_id varchar,
    updated_at timestamptz default now(),
    updated_by varchar,
    updated_by_id varchar
);
