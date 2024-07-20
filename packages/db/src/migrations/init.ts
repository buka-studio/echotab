import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
      CREATE OR REPLACE FUNCTION trigger_set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
  `.execute(db);

  await sql`
        create table
            public.links (
                id bigint generated by default as identity,
                "localId" uuid not null,
                url text not null,
                title text null,
                created_at timestamp with time zone not null default now(),
                constraint links_pkey primary key (id),
                constraint links_id_key unique (id)
            ) tablespace pg_default;
    `.execute(db);

  await sql`
          create table
            public.lists (
                id bigint generated by default as identity,
                "publicId" uuid not null default gen_random_uuid (),
                "localId" uuid not null,
                "ownerId" uuid not null,
                title text null,
                content text not null,
                "viewCount" bigint not null default 0,
                "importCount" bigint not null default 0,
                published boolean not null default true,
                ogImageUrl text null,
                created_at timestamp with time zone not null default now(),
                updated_at timestamp with time zone not null default now(),
                constraint lists_pkey primary key (id)
            ) tablespace pg_default;

            create trigger set_timestamp before
            update on lists for each row
            execute function trigger_set_updated_at ();
    `.execute(db);

  await sql`
        create table
            public.lists_links (
                id bigint generated by default as identity,
                "listId" bigint not null,
                "linkId" bigint not null,
                created_at timestamp with time zone not null default now(),
                constraint lists_links_pkey primary key (id),
                constraint lists_links_linkId_fkey foreign key ("linkId") references links (id),
                constraint lists_links_listId_fkey foreign key ("listId") references lists (id)
            ) tablespace pg_default;
    `.execute(db);
}