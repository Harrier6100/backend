create table properties (
    id varchar primary key,
    name varchar,
    unit varchar,
    created_at timestamptz default now(),
    created_by varchar,
    created_by_id varchar,
    updated_at timestamptz default now(),
    updated_by varchar,
    updated_by_id varchar
);
