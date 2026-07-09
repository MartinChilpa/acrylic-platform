# E2E Tests — Video Upload Similarity Search

End-to-end tests for the video upload and similarity search feature using Playwright.

## Prerequisites

1. **Backend running**: Start `acrylic-core` in a separate terminal:
   ```bash
   cd ../acrylic-core
   source venv/bin/activate
   python manage.py runserver
   ```
   Confirm it's responding: `curl http://127.0.0.1:8000/api/v1/auth/token/` should return a DRF response.

2. **AIMS credentials**: Ensure `acrylic-core/.env` contains valid `AIMS_CLIENT_ID` and `AIMS_API_SECRET`, since tests call the real AIMS API. Each test run incurs real API cost/quota against `api.aimsapi.com`.

3. **Frontend packages**: Ensure npm dependencies are installed:
   ```bash
   npm install
   ```

## Running Tests

From the `acrylic-platform` directory:

```bash
# Run all tests in chromium browser
npm run e2e

# Run with visual step-by-step debugger (great for first-time failures)
npm run e2e:ui

# View the HTML report after a run
npx playwright show-report
```

## What Tests Do

- **Test 1 (Happy Path)**: Uploads a valid MP4 video, waits for AIMS processing (up to 30 seconds), and verifies similarity results appear.
- **Test 2 (Client-side Validation)**: Uploads a non-MP4 file and verifies the UI rejects it with an error message.

## Common Issues

### `global-setup` fails on `fetch`: Django not running
Make sure `acrylic-core`'s `python manage.py runserver` is active. The endpoint `http://127.0.0.1:8000/api` must be reachable.

### Seed endpoint returns 404
The test-seeding endpoint is only available when `DEBUG=True` in Django settings. If your local config has `DEBUG=False`, set it to `True`.

### Test hangs on "Searching..."
AIMS might be slow or credentials invalid. Check `acrylic-core` server logs for the AIMS API response. If credentials are missing or expired, update `.env` and restart Django.

### Video preview doesn't show after upload
Ensure the uploaded file path in the spec (`e2e_tests/fixtures/sample-video.mp4`) exists and is a valid MP4.

## Architecture Notes

- Tests run serially (one after the other), not in parallel, to avoid stress on the AIMS API.
- `global-setup.ts` creates a test user and logs in once before all tests run, saving the session to `.auth/user.json` (gitignored).
- All subsequent tests reuse that authenticated session via Playwright's `storageState`.
- No `ACRYLIC_CORE_PATH` env var needed — tests communicate with the backend over HTTP, so repo layout doesn't matter. This design survives GitHub Actions where each repo is checked out in isolation.
