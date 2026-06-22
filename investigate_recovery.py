import paramiko
import io

with open(r'C:\Users\Nazim\.ssh\codex_kilo_hetzner', 'r') as f:
    key_str = f.read()
key = paramiko.Ed25519Key.from_private_key(io.StringIO(key_str), password='Lahore!23')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('178.105.221.236', username='root', pkey=key, timeout=10, banner_timeout=10)

print('=== RUNNING BATCHES (ALL) ===')
cmd = """docker exec yqqpuj8fuqvrezu2bklxr7ij psql -U postgres -d postgres -c "SELECT id, status, total_rows, created_at, metadata->'acquisition'->>'workerId' as worker_id, metadata->'acquisition'->'checkpoint'->>'lastRegistrationNumber' as last_reg, metadata->'acquisition'->'checkpoint'->>'processed' as processed FROM import_batches WHERE adapter_type='drap-mirror' AND status='RUNNING' ORDER BY created_at;" """
stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode())

print('\n=== BATCH ITEM CHECKPOINTS ===')
cmd = """docker exec yqqpuj8fuqvrezu2bklxr7ij psql -U postgres -d postgres -c "SELECT import_batch_id, MAX(row_number) as max_row, COUNT(*) as total_items FROM import_batch_items WHERE import_batch_id IN (SELECT id FROM import_batches WHERE adapter_type='drap-mirror' AND status='RUNNING') GROUP BY import_batch_id;" """
stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode())

print('\n=== MIRROR RUNTIME CONTROL ===')
cmd = """docker exec yqqpuj8fuqvrezu2bklxr7ij psql -U postgres -d postgres -c "SELECT key, state, updated_at FROM mirror_runtime_control;" """
stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode())

print('\n=== LATEST BATCH CHECKPOINTS ===')
cmd = """docker exec yqqpuj8fuqvrezu2bklxr7ij psql -U postgres -d postgres -c "SELECT id, metadata->'acquisition'->'checkpoint' as checkpoint FROM import_batches WHERE adapter_type='drap-mirror' AND status='RUNNING' ORDER BY created_at;" """
stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode())

client.close()