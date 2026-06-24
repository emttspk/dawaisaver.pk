import psycopg2
import sys

conn_string = "postgresql://postgres:6ZjbObb1q7ZhdVky1DkD76R4czwpfHXp47J5hfpADFCWo5wq7JhXDrK64JyaMQnw@yqqpuj8fuqvrezu2bklxr7ij:5432/postgres"

queries = [
    "SELECT count(*) FROM import_batch",
    "SELECT count(*) FROM import_batch_items",
    "SELECT count(*) FROM products",
    "SELECT count(*) FROM manufacturers",
    "SELECT count(*) FROM composition_groups",
    "SELECT count(*) FROM canonical_products",
    "SELECT count(*) FROM generics"
]

try:
    conn = psycopg2.connect(conn_string)
    cur = conn.cursor()
    for q in queries:
        cur.execute(q)
        print(f"{q.split()[3]}: {cur.fetchone()[0]}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)