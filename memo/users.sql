create table users (
    id varchar primary key,
    name varchar,
    language varchar,
    password varchar,
    remarks varchar,
    is_active boolean default true,
    created_at timestamptz default now(),
    created_by varchar,
    created_by_id varchar,
    updated_at timestamptz default now(),
    updated_by varchar,
    updated_by_id varchar
);
