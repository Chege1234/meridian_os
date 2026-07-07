-- Migration: 0008_add_nvidia_provider.sql
--
-- Adds 'nvidia' to the credential_provider enum type.
--

ALTER TYPE "public"."credential_provider" ADD VALUE 'nvidia';
