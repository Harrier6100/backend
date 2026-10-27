create table workflow_actions (
    id serial primary key,
    instance_id integer references workflow_instances(id),
    step_order integer,
    approver_id varchar,
    action varchar,
    acted_as_id varchar,
    remarks text,
    created_at timestamptz default now(),
    created_by varchar,
    created_by_id varchar,
    updated_at timestamptz default now(),
    updated_by varchar,
    updated_by_id varchar
);
