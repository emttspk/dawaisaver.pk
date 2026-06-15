CREATE TYPE search_entity_type AS ENUM (
  'PRODUCT',
  'GENERIC',
  'MANUFACTURER',
  'SIGNATURE',
  'ALTERNATIVE'
);

CREATE TYPE search_suggestion_type AS ENUM (
  'BRAND',
  'GENERIC',
  'MANUFACTURER',
  'SIGNATURE',
  'REGISTRATION_NUMBER',
  'CITY'
);

CREATE TABLE search_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL UNIQUE,
  query text NOT NULL,
  normalized_query text NOT NULL,
  entity_type search_entity_type NOT NULL,
  filters jsonb,
  result_data jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  status record_status NOT NULL DEFAULT 'ACTIVE',
  confidence_score numeric(5,4),
  source_type source_type NOT NULL DEFAULT 'SYSTEM',
  source_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by_id uuid,
  updated_by_id uuid,
  deleted_by_id uuid
);

CREATE TABLE search_popularity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type search_entity_type NOT NULL,
  entity_id uuid,
  query text NOT NULL,
  normalized_query text NOT NULL,
  city text,
  search_count integer NOT NULL DEFAULT 0,
  last_searched_at timestamptz,
  trending_score numeric(10,4) NOT NULL DEFAULT 0,
  status record_status NOT NULL DEFAULT 'ACTIVE',
  confidence_score numeric(5,4),
  source_type source_type NOT NULL DEFAULT 'SYSTEM',
  source_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by_id uuid,
  updated_by_id uuid,
  deleted_by_id uuid,
  CONSTRAINT search_popularity_unique_query UNIQUE (entity_type, normalized_query, city)
);

CREATE TABLE search_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion text NOT NULL,
  normalized_suggestion text NOT NULL,
  suggestion_type search_suggestion_type NOT NULL,
  entity_id uuid,
  popularity_score numeric(10,4) NOT NULL DEFAULT 0,
  status record_status NOT NULL DEFAULT 'ACTIVE',
  confidence_score numeric(5,4),
  source_type source_type NOT NULL DEFAULT 'SYSTEM',
  source_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by_id uuid,
  updated_by_id uuid,
  deleted_by_id uuid,
  CONSTRAINT search_suggestions_unique_suggestion UNIQUE (suggestion_type, normalized_suggestion)
);

CREATE TABLE search_synonyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL,
  normalized_term text NOT NULL,
  synonym text NOT NULL,
  normalized_synonym text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  status record_status NOT NULL DEFAULT 'ACTIVE',
  confidence_score numeric(5,4),
  source_type source_type NOT NULL DEFAULT 'SYSTEM',
  source_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by_id uuid,
  updated_by_id uuid,
  deleted_by_id uuid,
  CONSTRAINT search_synonyms_unique_synonym UNIQUE (normalized_term, normalized_synonym, language)
);

CREATE INDEX search_cache_normalized_query_idx ON search_cache (normalized_query);
CREATE INDEX search_cache_entity_type_idx ON search_cache (entity_type);
CREATE INDEX search_cache_expires_at_idx ON search_cache (expires_at);
CREATE INDEX search_cache_status_idx ON search_cache (status);
CREATE INDEX search_popularity_entity_type_idx ON search_popularity (entity_type);
CREATE INDEX search_popularity_entity_id_idx ON search_popularity (entity_id);
CREATE INDEX search_popularity_normalized_query_idx ON search_popularity (normalized_query);
CREATE INDEX search_popularity_city_idx ON search_popularity (city);
CREATE INDEX search_popularity_trending_score_idx ON search_popularity (trending_score);
CREATE INDEX search_suggestions_normalized_suggestion_idx ON search_suggestions (normalized_suggestion);
CREATE INDEX search_suggestions_type_idx ON search_suggestions (suggestion_type);
CREATE INDEX search_suggestions_popularity_score_idx ON search_suggestions (popularity_score);
CREATE INDEX search_suggestions_status_idx ON search_suggestions (status);
CREATE INDEX search_synonyms_normalized_term_idx ON search_synonyms (normalized_term);
CREATE INDEX search_synonyms_normalized_synonym_idx ON search_synonyms (normalized_synonym);
CREATE INDEX search_synonyms_status_idx ON search_synonyms (status);
