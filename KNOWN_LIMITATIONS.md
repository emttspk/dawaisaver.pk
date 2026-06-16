# Known Limitations

## Runtime

- `R2_ACCESS_KEY_ID` is still a manual Cloudflare Dashboard value.
- `R2_SECRET_ACCESS_KEY` is still a manual Cloudflare Dashboard value.
- `R2_PUBLIC_BASE_URL` is still a manual Cloudflare Dashboard value.
- Public access via `r2.dev` is disabled for `dawaisaver-pk`.

## Upload Path

- The current upload service is R2-backed and avoids local filesystem persistence.
- The live app-level upload flow still needs the manual Cloudflare values attached in Railway before end-to-end production upload verification can be repeated there.

## UAT Scope

- Bucket-level R2 smoke testing is complete.
- Full closed-beta upload UAT should be re-run after the missing runtime values are attached.
