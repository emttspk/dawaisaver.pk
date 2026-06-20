CREATE TABLE IF NOT EXISTS "mirror_runtime_control" (
    "key" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'stopped',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mirror_runtime_control_pkey" PRIMARY KEY ("key")
);

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mirror_runtime_control_updated_at BEFORE UPDATE ON "mirror_runtime_control"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();