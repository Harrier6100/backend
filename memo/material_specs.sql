create table material_specs (
    spec_id uuid primary key default gen_random_uuid(),
    material_id varchar not null references materials (id),
    supplier_id varchar not null references suppliers (id),
    version_number integer not null,
    active_start timestamptz not null,
    active_end timestamptz,
    specs jsonb default '[]'::jsonb,
    created_at timestamptz default now(),
    created_by varchar,
    created_by_id varchar,
    updated_at timestamptz default now(),
    updated_by varchar,
    updated_by_id varchar,
    unique (material_id, supplier_id, version_number)
);
