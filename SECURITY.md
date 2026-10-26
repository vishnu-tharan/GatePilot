# Security

- Keep `.env`, `.docker/secrets`, database files and session tokens out of Git and public screenshots.
- Passwords use bcrypt. Sessions expire after eight hours; only token hashes are stored. Browser cookies are HttpOnly and SameSite Strict; production cookies require HTTPS. Native tokens use SecureStore.
- Server-side roles, department scopes, input checks, request protection headers, account lockout and rate limits remain mandatory.
- Password changes revoke every session. Disabling an account immediately removes its access. Display-name changes cannot alter roles or assignments.
- The local demo and Docker setup are for development. Internet deployment needs HTTPS, secure cookie settings, a restricted database, backups and an operational security review. Multiple API instances need shared rate-limit storage.
- Android and iOS bundle exports do not prove device behavior. Test native secure storage and accessibility on physical devices before release.
- Report security issues privately to the project owner. Do not post passwords, visitor identities or tokens in public issues.
