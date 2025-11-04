# CTFd Scoreboard - CORS Solution

## Problem
When the CTF Scoreboard application makes direct API calls from the browser to a CTFd instance, browsers enforce CORS (Cross-Origin Resource Sharing) policies. This blocks requests unless the CTFd server is configured to allow them.

## Solution
This project implements a dual-mode approach:

### Development Mode (localhost)
- **Uses API Proxy**: All API requests go through a Next.js API route (`/api/ctfd/[...path]`)
- **No CORS Issues**: The proxy runs on the same origin as the frontend
- **Full Functionality**: Works seamlessly without any CTFd configuration changes

### Production Mode (Static Export)
- **Direct API Calls**: The application makes direct requests to CTFd
- **Requires CORS**: Your CTFd instance must be configured to allow requests from your deployment domain
- **Static Deployment**: Can be deployed to GitHub Pages, Netlify, Vercel, etc.

## How It Works

### Development
1. Start the dev server: `npm run dev`
2. The application detects it's running on `localhost`
3. All API calls are automatically routed through `/api/ctfd/[...path]`
4. The proxy forwards requests to your CTFd instance
5. Responses are returned to the frontend

### Production Build
1. Run: `npm run build`
2. The build script automatically removes the `app/api` folder
3. Next.js creates a static export (no server-side code)
4. The application makes direct API calls to CTFd
5. Deploy the `out` folder to any static hosting

## Configuration

### For Local Development
No special configuration needed! Just:
```bash
npm install
npm run dev
```

Then configure the application through the settings dialog with:
- **CTFd URL**: e.g., `https://demo.ctfd.io`
- **API Token**: Your CTFd API token
- **Refresh Interval**: 5-300 seconds

### For Production Deployment

#### Option 1: Configure CORS on CTFd (Recommended)
Add your deployment domain to CTFd's allowed origins. This is typically done in:
- CTFd configuration file
- Reverse proxy (nginx, Apache, Cloudflare)
- Web server configuration

Example nginx configuration:
```nginx
add_header Access-Control-Allow-Origin "https://your-domain.github.io";
add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
add_header Access-Control-Allow-Headers "Authorization, Content-Type";
```

#### Option 2: Use a CORS Proxy
If you cannot modify the CTFd server, you can:
1. Deploy your own CORS proxy
2. Route requests through it
3. Update the application's API URL to point to your proxy

## API Detection Logic

The application automatically detects the environment:

```typescript
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
```

- **localhost**: Uses `/api/ctfd` proxy
- **Any other domain**: Makes direct API calls

## Testing

### Test Locally
1. Configure the application with valid CTFd credentials
2. The scoreboard should load data successfully
3. Check browser DevTools console for any errors

### Test Production Build Locally
```bash
npm run build
npx serve out
```

Note: This will fail with CORS errors unless you:
- Configure CORS on your CTFd instance, OR
- Test with a local CTFd instance that allows all origins

## Troubleshooting

### "Failed to load scoreboard" in Development
- Check that `npm run dev` is running
- Verify CTFd URL and API token are correct
- Check that the CTFd instance is accessible from your machine

### "Failed to load scoreboard" in Production
- Verify CORS is configured on your CTFd server
- Check browser DevTools console for CORS errors
- Test API access with curl:
  ```bash
  curl -H "Origin: https://your-domain.com" \
       -H "Authorization: Token YOUR_TOKEN" \
       https://your-ctfd-instance.com/api/v1/scoreboard
  ```

### API Token Expired
- API tokens provided in the problem statement are valid for 30 minutes
- Generate a new token from your CTFd admin panel
- Update the configuration in the settings dialog

## Build Process

The `package.json` includes a custom build process:

```json
{
  "scripts": {
    "build": "npm run build:clean-api && next build --turbopack",
    "build:clean-api": "rm -rf app/api || true"
  }
}
```

This ensures the API proxy folder is removed before creating the static export, preventing build errors.

## Architecture

### Files Modified
- `lib/api.ts`: Added environment detection and proxy routing
- `next.config.ts`: Made `output: 'export'` conditional on production mode
- `package.json`: Added build script to remove API folder
- `app/api/ctfd/[...path]/route.ts`: New API proxy route (dev only)

### Key Features
- ✅ Automatic environment detection
- ✅ Zero configuration for local development
- ✅ Clean separation of dev and production code
- ✅ Full static export support for production
- ✅ No breaking changes to existing functionality

## Notes
- The API proxy only exists in development and is removed during production builds
- The proxy logs requests to the console for debugging
- All retry logic and rate limiting from the original code is preserved
- The responsive design improvements work in both modes
