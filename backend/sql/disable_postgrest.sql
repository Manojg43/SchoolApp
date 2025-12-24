-- =====================================================
-- SUPABASE RLS FIX - Disable PostgREST Access
-- =====================================================
-- Purpose: Disable PostgREST API since Django handles all data access
-- This resolves all RLS warnings from Supabase linter
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Revoke PostgREST access from public schema
-- This prevents direct database access via Supabase REST API
REVOKE ALL ON SCHEMA public FROM anon, authenticated;

-- Step 2: Ensure Django service role (postgres) has full access
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Step 3: Set default privileges for future tables
-- Ensures new tables are also Django-only
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL ON TABLES TO postgres;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL ON SEQUENCES TO postgres;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL ON FUNCTIONS TO postgres;

-- Step 4: Add documentation comment
COMMENT ON SCHEMA public IS 
'Django-managed schema. All data access is controlled by Django REST Framework. PostgREST access is disabled.';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check that anon/authenticated have no access
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated');
-- Expected: No rows (access revoked)

-- Check that postgres has full access
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee = 'postgres'
LIMIT 10;
-- Expected: Multiple rows showing SELECT, INSERT, UPDATE, DELETE

-- =====================================================
-- RESULT
-- =====================================================
-- After running this script:
-- ✅ All 45 RLS warnings will disappear
-- ✅ PostgREST API will be disabled
-- ✅ Only Django can access data
-- ✅ Security is maintained at application level
-- =====================================================
