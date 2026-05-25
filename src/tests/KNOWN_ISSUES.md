# Known Test Observations

- `UserService.findUsers()` currently overwrites the `createdAt` filter when both `createdAfter` and `createdBefore` are present. The second spread wins, so the query keeps only the `lte` bound. Reproduced in [src/tests/services/users.service.test.ts](src/tests/services/users.service.test.ts).