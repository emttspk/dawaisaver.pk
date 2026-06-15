CREATE TYPE price_anomaly_type AS ENUM (
  'EXTREME_PRICING',
  'SUSPICIOUS_DROP',
  'SUSPICIOUS_SPIKE',
  'DUPLICATE_PRICE',
  'INVALID_PRICE'
);

CREATE TYPE market_signal_type AS ENUM (
  'BEST_PRICE',
  'RECOMMENDED_PRICE',
  'MARKET_AVERAGE'
);

CREATE TABLE product_price_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id),
  medicine_signature text,
  lowest_price numeric(12,2) NOT NULL,
  highest_price numeric(12,2) NOT NULL,
  average_price numeric(12,2) NOT NULL,
  median_price numeric(12,2) NOT NULL,
  latest_price numeric(12,2) NOT NULL,
  price_variance numeric(14,4) NOT NULL,
  availability_score numeric(6,4) NOT NULL,
  source_count integer NOT NULL,
  sample_count integer NOT NULL,
  calculated_at timestamptz NOT NULL DEFAULT now(),
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

CREATE TABLE city_price_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  medicine_signature text,
  city text NOT NULL,
  lowest_observed_price numeric(12,2) NOT NULL,
  highest_observed_price numeric(12,2) NOT NULL,
  average_price numeric(12,2) NOT NULL,
  availability_percentage numeric(6,4) NOT NULL,
  source_count integer NOT NULL,
  sample_count integer NOT NULL,
  calculated_at timestamptz NOT NULL DEFAULT now(),
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

CREATE TABLE market_price_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  medicine_signature text,
  signal_type market_signal_type NOT NULL,
  best_price numeric(12,2),
  recommended_price numeric(12,2),
  market_average numeric(12,2),
  price_stability_score numeric(6,4) NOT NULL,
  city text,
  calculated_at timestamptz NOT NULL DEFAULT now(),
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

CREATE TABLE price_anomalies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  price_snapshot_id uuid REFERENCES price_snapshots(id),
  medicine_signature text,
  anomaly_type price_anomaly_type NOT NULL,
  price numeric(12,2),
  expected_min numeric(12,2),
  expected_max numeric(12,2),
  severity_score numeric(6,4) NOT NULL,
  city text,
  detected_at timestamptz NOT NULL DEFAULT now(),
  status record_status NOT NULL DEFAULT 'PENDING_REVIEW',
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

CREATE TABLE price_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  medicine_signature text,
  city text,
  window_days integer NOT NULL,
  start_price numeric(12,2),
  end_price numeric(12,2),
  min_price numeric(12,2),
  max_price numeric(12,2),
  average_price numeric(12,2),
  direction price_change_direction NOT NULL,
  volatility_score numeric(6,4) NOT NULL,
  calculated_at timestamptz NOT NULL DEFAULT now(),
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

CREATE INDEX product_price_statistics_product_idx ON product_price_statistics (product_id);
CREATE INDEX product_price_statistics_signature_idx ON product_price_statistics (medicine_signature);
CREATE INDEX product_price_statistics_calculated_at_idx ON product_price_statistics (calculated_at);
CREATE INDEX city_price_statistics_product_idx ON city_price_statistics (product_id);
CREATE INDEX city_price_statistics_signature_idx ON city_price_statistics (medicine_signature);
CREATE INDEX city_price_statistics_city_idx ON city_price_statistics (city);
CREATE INDEX city_price_statistics_calculated_at_idx ON city_price_statistics (calculated_at);
CREATE INDEX market_price_signals_product_idx ON market_price_signals (product_id);
CREATE INDEX market_price_signals_signature_idx ON market_price_signals (medicine_signature);
CREATE INDEX market_price_signals_type_idx ON market_price_signals (signal_type);
CREATE INDEX market_price_signals_city_idx ON market_price_signals (city);
CREATE INDEX market_price_signals_calculated_at_idx ON market_price_signals (calculated_at);
CREATE INDEX price_anomalies_product_idx ON price_anomalies (product_id);
CREATE INDEX price_anomalies_snapshot_idx ON price_anomalies (price_snapshot_id);
CREATE INDEX price_anomalies_signature_idx ON price_anomalies (medicine_signature);
CREATE INDEX price_anomalies_type_idx ON price_anomalies (anomaly_type);
CREATE INDEX price_anomalies_detected_at_idx ON price_anomalies (detected_at);
CREATE INDEX price_trends_product_idx ON price_trends (product_id);
CREATE INDEX price_trends_signature_idx ON price_trends (medicine_signature);
CREATE INDEX price_trends_city_idx ON price_trends (city);
CREATE INDEX price_trends_window_days_idx ON price_trends (window_days);
CREATE INDEX price_trends_calculated_at_idx ON price_trends (calculated_at);
