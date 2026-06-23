CREATE TABLE ingredient_review_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_ingredient text NOT NULL,
  normalized_ingredient text NOT NULL,
  occurrence_count integer NOT NULL DEFAULT 1,
  match_pattern text,
  confidence_score numeric(5,4),
  review_status text NOT NULL DEFAULT 'PENDING_AI',
  ai_reasoning text,
  suggested_generic_id uuid,
  resolved_generic_id uuid,
  source_type source_type,
  source_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT ingredient_review_queue_suggested_generic_id_fkey
    FOREIGN KEY (suggested_generic_id) REFERENCES generics(id) ON DELETE SET NULL,
  CONSTRAINT ingredient_review_queue_resolved_generic_id_fkey
    FOREIGN KEY (resolved_generic_id) REFERENCES generics(id) ON DELETE SET NULL
);

CREATE INDEX ingredient_review_queue_normalized_ingredient_idx ON ingredient_review_queue (normalized_ingredient);
CREATE UNIQUE INDEX ingredient_review_queue_normalized_ingredient_key ON ingredient_review_queue (normalized_ingredient);
CREATE INDEX ingredient_review_queue_review_status_idx ON ingredient_review_queue (review_status);
CREATE INDEX ingredient_review_queue_suggested_generic_id_idx ON ingredient_review_queue (suggested_generic_id);
CREATE INDEX ingredient_review_queue_resolved_generic_id_idx ON ingredient_review_queue (resolved_generic_id);

CREATE TABLE ingredient_review_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_review_queue_id uuid NOT NULL,
  previous_status text,
  new_status text NOT NULL,
  previous_suggested_generic_id uuid,
  new_suggested_generic_id uuid,
  confidence_score numeric(5,4),
  reasoning text,
  actor_type text,
  actor_id uuid,
  source_type source_type,
  source_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT ingredient_review_history_queue_id_fkey
    FOREIGN KEY (ingredient_review_queue_id) REFERENCES ingredient_review_queue(id) ON DELETE CASCADE
);

CREATE INDEX ingredient_review_history_queue_id_idx ON ingredient_review_history (ingredient_review_queue_id);
CREATE INDEX ingredient_review_history_new_status_idx ON ingredient_review_history (new_status);
CREATE INDEX ingredient_review_history_actor_type_idx ON ingredient_review_history (actor_type);

CREATE TABLE ingredient_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_review_queue_id uuid,
  generic_id uuid NOT NULL,
  alias_value text NOT NULL,
  normalized_value text NOT NULL,
  alias_type text NOT NULL,
  status record_status NOT NULL DEFAULT 'ACTIVE',
  confidence_score numeric(5,4),
  source_type source_type,
  source_url text,
  approved_at timestamptz,
  approved_by_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT ingredient_aliases_generic_id_fkey
    FOREIGN KEY (generic_id) REFERENCES generics(id) ON DELETE CASCADE,
  CONSTRAINT ingredient_aliases_queue_id_fkey
    FOREIGN KEY (ingredient_review_queue_id) REFERENCES ingredient_review_queue(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX ingredient_aliases_generic_normalized_alias_type_key
  ON ingredient_aliases (generic_id, normalized_value, alias_type);
CREATE INDEX ingredient_aliases_normalized_value_idx ON ingredient_aliases (normalized_value);
CREATE INDEX ingredient_aliases_alias_type_idx ON ingredient_aliases (alias_type);
CREATE INDEX ingredient_aliases_status_idx ON ingredient_aliases (status);
CREATE INDEX ingredient_aliases_queue_id_idx ON ingredient_aliases (ingredient_review_queue_id);
