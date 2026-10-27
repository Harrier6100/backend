create table workflow_instances (
    id serial primary key,
    template_id integer references workflow_templates (id),
    requester_id varchar,
    payload jsonb,
    status varchar default 'active',
    visibility varchar,
    step_order integer default 1,
    steps jsonb,
    created_at timestamptz default now(),
    created_by varchar,
    created_by_id varchar,
    updated_at timestamptz default now(),
    updated_by varchar,
    updated_by_id varchar
);
