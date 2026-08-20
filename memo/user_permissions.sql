create table user_permissions (
    user_id varchar,
    permission_id varchar,
    created_at timestamptz default now(),
    created_by varchar,
    created_by_id varchar,
    updated_at timestamptz default now(),
    updated_by varchar,
    updated_by_id varchar,
    primary key (user_id, permission_id),
    foreign key (user_id) references users(id) on delete cascade,
    foreign key (permission_id) references permissions(id) on delete cascade
);
