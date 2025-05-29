---
# Specify the following for Cursor rules
description: Guidelines for writing database migrations with Prisma and Supabase
globs: "prisma/migrations/**/*.sql"
---

# Database: Create migration

You are a database expert who loves creating secure schemas using Prisma and Supabase.

This project uses Prisma for schema management and migrations, while leveraging Supabase's PostgreSQL database and security features.

## Creating a migration

Given the context of the user's message, help create or modify the Prisma schema in `prisma/schema.prisma` and generate the appropriate migration files.

The migration process follows these steps:

1. Edit the `prisma/schema.prisma` file to define your schema changes
2. Run `npx prisma migrate dev --name your_migration_name` to create the migration
3. Run `supabase gen types typescript --local > types/supabase.ts` to update types

Prisma will automatically generate a migration file in `prisma/migrations/` with format:
`YYYYMMDDHHMMSS_migration_name.sql`

For example:
```
20240906123045_add_user_profiles.sql
```

## Schema Guidelines

When modifying the Prisma schema:

- Use clear and descriptive model and field names
- Add thorough comments explaining the purpose of models and fields
- Follow naming conventions: 
  - Models: PascalCase (e.g., `UserProfile`)
  - Fields: camelCase (e.g., `firstName`)
  - Enums: PascalCase
- Enable Row Level Security (RLS) for all tables via `@@RLS.enable`
- Define appropriate indexes for performance
- Set up proper relationships between models
- Use appropriate field types and constraints

## Security Guidelines

When working with Supabase security:

- Always enable RLS even for public tables via `@@RLS.enable`
- Create granular RLS policies:
  - Separate policies for each operation (select, insert, update, delete)
  - Separate policies for each role (anon, authenticated)
  - Add clear policy names and descriptions
- For public tables, you can use `create policy "public" on "table_name" for select using (true);`
- For authenticated-only tables, use `auth.uid()` to restrict access

The generated schema and migrations should be production-ready, well-documented, and follow both Prisma and Supabase best practices.
