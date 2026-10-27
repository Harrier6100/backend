create table workflow_delegates (
    id serial primary key,
    delegator_id varchar, -- 委任する人
    delegate_id varchar, -- 委任された人
    start_date date,
    end_date date,
    deleted_at timestamptz,
    created_at timestamptz default now(),
    created_by varchar,
    created_by_id varchar,
    updated_at timestamptz default now(),
    updated_by varchar,
    updated_by_id varchar
);
