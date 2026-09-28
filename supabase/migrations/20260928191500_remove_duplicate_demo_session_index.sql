-- Keep the UNIQUE constraint index on token_hash; remove the redundant secondary index.
drop index if exists public.idx_demo_sessions_token_hash;
