# Current Update - P15 Access Recovery and Production Database Setup

## Date

2026-06-16

## Status

Blocked on GitHub SSH and Railway authentication.

## Verified

- `C:\Users\Nazim\.ssh\id_ed25519_emttspk.pub` exists and contains the expected `emttspk` public key.
- `ssh -i C:\Users\Nazim\.ssh\id_ed25519_emttspk -o IdentitiesOnly=yes -o BatchMode=yes -T git@github.com` still returns `Permission denied (publickey)`.
- The `emttspk` GitHub account has not yet accepted the SSH key.
- `railway.cmd whoami` returns `Unauthorized. Please login with railway login` once stale env vars are cleared.
- `railway.cmd status` returns `Unauthorized. Please login with railway login` once stale env vars are cleared.

## Required GitHub Steps

1. Open GitHub.
2. Go to `Settings`.
3. Open `SSH and GPG Keys`.
4. Select `New SSH Key`.
5. Add `C:\Users\Nazim\.ssh\id_ed25519_emttspk.pub`.
6. Save it on the `emttspk` account.
7. Re-run `ssh -T git@github.com` and verify the authenticated account.

## Required Railway Step

Obtain a fresh Railway token with access to project `dawaisaver.pk` (`e38bb3da-7ab5-4654-b504-101e74c92d5b`) and set it for the CLI before continuing with `railway status`, Postgres, variables, or migrations.
