BEGIN;

ALTER TABLE public.communities
  ADD CONSTRAINT communities_name_length_check
    CHECK (
      name = btrim(name)
      AND char_length(name) BETWEEN 2 AND 80
    ),
  ADD CONSTRAINT communities_slug_format_check
    CHECK (
      char_length(slug) BETWEEN 2 AND 40
      AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    ),
  ADD CONSTRAINT communities_description_length_check
    CHECK (
      description IS NULL OR (
        description = btrim(description)
        AND char_length(description) <= 500
      )
    );

REVOKE UPDATE ON TABLE public.communities FROM anon, authenticated;
GRANT UPDATE (name, slug, description, activity_type_id, deleted_at)
  ON TABLE public.communities TO authenticated;

COMMIT;
