# AI Project Requirements - Prevent Fake/Demo Code

## The Problem

AI assistants often create code that LOOKS functional but isn't:
- localStorage instead of real databases
- Mock uploads that don't actually save anywhere
- Admin panels that only work locally
- Features that disappear when you refresh or change browsers

## Before Starting ANY Project, State These Requirements:

### Required Prompt Template

```
I need a PRODUCTION-READY [website/app/feature] that:

1. PERSISTENCE: All data must be stored in a REAL database or file storage
   that persists across:
   - Browser refreshes
   - Different devices
   - Different users
   - Server restarts

2. NO localStorage/sessionStorage for important data
   - localStorage is ONLY acceptable for user preferences (dark mode, etc.)
   - NEVER for content, uploads, or anything that needs to persist

3. FILE UPLOADS must actually:
   - Upload to real storage (Vercel Blob, AWS S3, Cloudinary, etc.)
   - Be accessible via URL after upload
   - Persist permanently until deleted

4. ADMIN PANELS must:
   - Actually modify the live site
   - Changes visible to all users, not just the admin's browser
   - Work from any device/browser

5. NO MOCK DATA or placeholder functionality
   - If a feature can't be fully implemented, tell me upfront
   - Don't create fake buttons that don't do anything real

6. DEPLOYMENT-READY
   - Must work when deployed (Vercel, Netlify, etc.)
   - Not just "works on localhost"
```

### Red Flags to Watch For

| Red Flag | What It Means |
|----------|---------------|
| "Saves to localStorage" | Data only exists in YOUR browser, gone if you clear cache |
| "Mock upload" / "Simulated" | Doesn't actually upload anywhere |
| "For demo purposes" | Not real functionality |
| "Works locally" | Won't work when deployed |
| "Client-side only" | No real backend, no persistence |
| "In-memory storage" | Gone when server restarts |
| "Sample data" / "Placeholder" | Fake content, not real functionality |

### Questions to Ask Before Accepting Code

1. "Where is the data actually stored?"
   - Good: PostgreSQL, MongoDB, Vercel Blob, AWS S3, Supabase
   - Bad: localStorage, sessionStorage, in-memory, JSON files

2. "Will uploads persist after deployment?"
   - Good: Yes, stored in [specific cloud service]
   - Bad: They're base64 in localStorage / saved locally

3. "Can another user see changes I make in admin?"
   - Good: Yes, it's stored in a shared database
   - Bad: No, it's browser-specific

4. "What happens when I clear my browser cache?"
   - Good: Nothing, data is on the server
   - Bad: Everything is lost

### For This Specific Project (Light-UI)

To make the admin panel ACTUALLY work, you need:

```
I need a FUNCTIONAL admin panel for my Vercel-hosted static site that:

1. Uses Vercel Blob or similar for image/video uploads
2. Uses Vercel KV, Supabase, or PlanetScale for content storage
3. Has Vercel serverless API routes for CRUD operations
4. Admin changes are visible on the live site immediately
5. Works from any browser/device, not just mine
6. File uploads persist permanently in cloud storage

Tech stack:
- Vercel for hosting
- Vercel Blob for file storage
- Vercel KV or Supabase for database
- Serverless functions for API

DO NOT use localStorage for anything except UI preferences.
DO NOT create mock/simulated uploads.
DO NOT create features that only work in one browser.
```

### Checklist Before Deploying

- [ ] Create test content in admin panel
- [ ] Open site in incognito/different browser
- [ ] Can you see the content you just created?
- [ ] Upload a file, refresh page - is it still there?
- [ ] Open on your phone - does everything work?
- [ ] Clear browser cache - is data still there?

If ANY of these fail, the implementation is not production-ready.

## Summary

**Always demand:**
- Real database (not localStorage)
- Real file storage (not base64 in browser)
- Real API endpoints (not client-side only)
- Cross-browser/cross-device functionality
- Persistence after cache clear

**Never accept:**
- "Demo" or "mock" functionality
- localStorage for important data
- "Works on my machine" solutions
- Features that look good but don't actually work
