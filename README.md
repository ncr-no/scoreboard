# CTF Scoreboard Dashboard

A modern, real-time CTF (Capture The Flag) scoreboard application built with Next.js that provides an enhanced viewing experience for CTFd competitions. This dashboard offers live updates, animated celebrations, comprehensive analytics, and a polished interface for both participants and spectators.

**🌐 Static Deployment Ready**: This application can be deployed as a static site to GitHub Pages, Netlify, Vercel, or any static hosting platform. It connects directly to your CTFd instance via API, running entirely in the browser.

> **⚠️ Important**: When deploying this application, you must configure CORS in your CTFd instance to allow requests from your deployment domain. See the [Deployment](#-deployment) section for details.

## ✨ Key Features

### 🏆 Real-Time Scoreboard
- **Live Rankings**: Real-time scoreboard updates with configurable refresh intervals (5-300 seconds)
- **Comprehensive User Stats**: View scores, solve counts, first bloods, and last solve timestamps
- **Pagination Support**: Navigate through large participant lists efficiently
- **Top 10 Quick View**: Instant access to leading competitors

### 🎯 Challenge Overview
- **Challenge Grid**: Visual overview of all available challenges with solve counts
- **Category Organization**: Challenges grouped by categories for easy navigation
- **Difficulty Indicators**: Visual representation of challenge values and solve rates
- **Challenge Details**: Expandable cards with descriptions and solver information

### 🔴 First Blood Celebrations
- **Animated Notifications**: Stunning animations when challenges are solved for the first time
- **Sound Effects**: Audio feedback for first blood achievements
- **User Recognition**: Highlight first blood achievers with special badges
- **Auto-dismiss**: Smart timing for celebration displays

### 📊 Advanced Analytics
- **Competition Statistics**: Total users, active participants, challenge metrics
- **Performance Metrics**: Average scores, top performers, submission counts
- **Visual Charts**: Interactive graphs showing competition progress
- **Time Tracking**: Live countdown timers and competition duration

### 🔄 Live Submissions Feed
- **Real-Time Updates**: Stream of the latest correct submissions
- **User Activity**: Track who's solving what in real-time
- **Submission History**: Comprehensive log of all solve attempts
- **Filtering Options**: Filter by submission type and user

### 🎨 Modern UI/UX
- **Dark/Light Themes**: Automatic theme switching based on system preference
- **Responsive Design**: Optimized for desktop, tablet, and mobile viewing
- **Smooth Animations**: Polished transitions and micro-interactions
- **Accessible Interface**: WCAG compliant design with proper ARIA labels

### ⚙️ Configuration Management
- **Easy Setup**: Simple dialog for CTFd instance configuration
- **API Integration**: Secure connection to CTFd API with token authentication
- **Flexible Refresh Rates**: Configurable polling intervals to balance performance
- **URL Validation**: Smart handling of CTFd instance URLs

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- A running CTFd instance with API access
- CTFd API token with appropriate permissions

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ctf-scoreboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser

### Configuration

On first launch, click the settings icon (⚙️) in the top-right corner to configure your CTFd connection:

- **CTFd API URL**: Your CTFd instance URL (e.g., `https://ctf.ncr-external.iaas.iik.ntnu.no`)
- **API Token**: Generate from your CTFd admin panel (see below)
- **Refresh Interval**: How often to poll for updates (5-300 seconds)
- **Top Teams Count**: Number of teams to display (10-100)

#### Getting Your API Token

If you're getting **401 Unauthorized errors**, you need to configure an API token:

1. **Log into your CTFd instance** as an admin
2. Navigate to **Admin Panel** → **Settings** → **Security**
3. Scroll to the **API** section
4. **Generate a new token** or copy an existing one
5. **Paste the token** into the configuration dialog in this application

The application will show a warning banner when authentication is required with instructions on how to fix it.

> **Note**: Some CTFd instances may allow public access to scoreboard data. If your instance requires authentication, you must configure an API token.

## 🏗️ Architecture

### Frontend Stack
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first styling
- **Framer Motion**: Smooth animations and transitions
- **Lucide React**: Modern icon library
- **TanStack Query**: Server state management and caching

### API Integration
- **CTFd REST API**: Direct integration with CTFd backend
- **Rate Limiting**: Intelligent request throttling with exponential backoff
- **Error Handling**: Robust error recovery and user feedback
- **Caching**: Optimized data fetching with intelligent cache invalidation

### Performance Features
- **Server-Side Rendering**: Fast initial page loads
- **Code Splitting**: Optimized bundle sizes
- **Image Optimization**: Automatic image compression and WebP conversion
- **Font Optimization**: Self-hosted Geist font family

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: Full-featured dashboard experience
- **Tablet**: Optimized layouts for medium screens
- **Mobile**: Touch-friendly interface with swipe gestures

## 🔧 Development

### Project Structure
```
├── app/                    # Next.js App Router pages
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (shadcn/ui)
│   └── page/             # Page-specific components
├── hooks/                # Custom React hooks
│   └── api/              # API integration hooks
├── lib/                  # Utility functions and API clients
├── types/                # TypeScript type definitions
├── contexts/             # React context providers
└── public/               # Static assets and sounds
```

### Available Scripts
- `npm run dev`: Start development server with Turbopack
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

### API Endpoints

The application includes a Next.js API route (`/api/ctfd`) that proxies requests to your CTFd instance:

- **Scoreboards**: `/scoreboard` and `/scoreboard/top/10`
- **Challenges**: `/challenges` and `/challenges/{id}`
- **Submissions**: `/submissions` with filtering options
- **Configuration**: `/configs` for CTF metadata
- **Challenge Solves**: `/challenges/{id}/solves` for first blood detection

## 🎵 Audio Features

The application includes audio feedback for enhanced user experience:
- **First Blood**: Celebration sound for first solves
- **Success**: General achievement notifications
- **Error**: Alert sounds for error states

Audio files are included in `/public/sounds/` and can be customized.

## 🚀 Deployment

### GitHub Pages (Recommended for Static Hosting)

This scoreboard can be deployed to GitHub Pages as a static site. The application will run entirely in the browser and connect directly to your CTFd instance via its API.

**Prerequisites:**
- Your CTFd instance must have CORS enabled to allow requests from your GitHub Pages domain
- Generate a CTFd API token with appropriate permissions

**Setup Instructions:**

1. **Configure GitHub Repository Settings:**
   - Go to your repository Settings → Pages
   - Under "Build and deployment", select "GitHub Actions" as the source

2. **Deploy:**
   - Push your changes to the `main` branch
   - The GitHub Actions workflow will automatically build and deploy your site
   - Your scoreboard will be available at `https://<username>.github.io/<repository-name>/`

3. **Optional: Custom Domain**
   - Add a `CNAME` file in the `public` directory with your domain
   - Configure your DNS settings to point to GitHub Pages
   - Update the `basePath` in `next.config.ts` if deploying to a subpath

4. **Configure CTFd CORS:**
   - Add your GitHub Pages URL to CTFd's allowed origins
   - This is typically done in CTFd's configuration or reverse proxy settings

**Note:** The first time you access the deployed site, you'll need to configure it with your CTFd API URL and token using the settings dialog.

### Manual Static Build
```bash
npm run build
# The static files will be in the 'out' directory
# Serve them with any static file server
```

### Alternative Deployment Platforms
- **Vercel**: Deploy with zero config (will use static export)
- **Netlify**: Drag and drop the `out` folder or connect your repository
- **Cloudflare Pages**: Connect your repository for automatic deployments
- **Any Static Host**: Upload the contents of the `out` directory

### Environment Considerations
- Ensure your CTFd instance is accessible from your deployment environment
- **Configure CORS settings in CTFd** to allow requests from your deployment domain
- Set appropriate rate limits to avoid overwhelming your CTFd instance
- The application stores configuration (API URL, token) in the browser's localStorage

> **⚠️ Security Warning:**  
> Data stored in localStorage (including your API token) can be accessed by any script running on the same origin.  
> **Do not use this application on shared or public computers unless you clear localStorage after use.**  
> To clear, open your browser's developer tools and run: `localStorage.clear();`

## 🔧 Troubleshooting

### 401 Unauthorized Errors

If you see **HTTP 401** errors in your browser console:

```
GET https://your-ctfd-instance.com/api/v1/scoreboard [HTTP/2 401]
GET https://your-ctfd-instance.com/api/v1/challenges [HTTP/2 401]
```

**Solution:**
1. Your CTFd instance requires authentication
2. Click the **Settings icon (⚙️)** in the top-right corner
3. Enter your **CTFd API URL** and **API Token**
4. Get your API token from: **Admin Panel** → **Settings** → **Security** in your CTFd instance

The application will display a helpful warning banner when authentication is required.

### CORS Errors

If you see CORS errors in your console:

```
Access to fetch at 'https://your-ctfd-instance.com' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
1. Configure your CTFd instance to allow requests from your application's origin
2. Add your domain to CTFd's CORS allowlist
3. This is typically done in CTFd's `config.py` or via reverse proxy (nginx, etc.)

### Rate Limiting Issues

If you see **HTTP 429** (Too Many Requests) errors:

**Solution:**
1. Open **Settings** (⚙️) and increase the **Refresh Interval**
2. Reduce the **Top Teams Count** (higher values = more API calls)
3. The application has built-in retry logic with exponential backoff

### Data Not Updating

If the scoreboard isn't refreshing:

**Solution:**
1. Check your **Refresh Interval** in settings
2. Verify your CTFd instance is accessible
3. Check browser console for errors
4. Try manually refreshing the page

### Configuration Not Saving

If your settings don't persist after refresh:

**Solution:**
1. Check that localStorage is enabled in your browser
2. Clear your browser cache and try again
3. Ensure you're not in incognito/private mode (some browsers restrict localStorage)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## 📄 License

This project is open source and available under the MIT License.

---

Built with ❤️ for the CTF community
