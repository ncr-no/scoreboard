'use client';

import { useState, useEffect } from 'react';
import { useScoreboard } from '@/hooks/api/useScoreboard';
import { getChallengeSolves } from '@/lib/api';
import { useFullScoreboard } from '@/hooks/api/useFullScoreboard';
import { useChallenges } from '@/hooks/api/useChallenges';
import { useSubmissions } from '@/hooks/api/useSubmissions';
import { useCtfName } from '@/hooks/api/useCtfName';
import { useCtfEnd } from '@/hooks/api/useCtfEnd';
import { useConfig } from '@/contexts/config-context';
import { useFirstBloodDetection } from '@/hooks/useFirstBloodDetection';
import { useFirstPlaceDetection } from '@/hooks/useFirstPlaceDetection';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Flag, Users, Clock, Target, TrendingUp, Settings, Droplets, CheckCircle } from "lucide-react";
import { ConfigDialog } from '@/components/config-dialog';
import { DynamicTitle } from '@/components/dynamic-title';
import { ChallengeCard } from '@/components/page/challenge-card';
import { ChallengeDetailView } from '@/components/page/challenge-detail-view';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RecentSubmissions } from '@/components/scoreboard-chart';
import { FirstBloodAnimation } from '@/components/first-blood-animation';
import { LiquidAnimation } from '@/components/liquid-animation';
import { DevTools } from '@/components/dev-tools';
import { AuthWarningBanner } from '@/components/auth-warning-banner';
import { Podium } from '@/components/podium';
import { ScoreboardEntry, Challenge } from '@/types/ctfd';
import { getCategoryDotColor, getCategoryColor } from '@/lib/utils';
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function CTFScoreboard() {
  const { isConfigured, config } = useConfig();
  const { data: scoreboardResponse, isLoading, isError, error } = useScoreboard();
  const { data: fullScoreboard } = useFullScoreboard();
  const { data: challenges, isLoading: challengesLoading, isError: challengesError } = useChallenges();
  // Fetch latest submissions for RecentSubmissions
  // First get metadata to calculate last page
  const { data: submissionsMetaData, refetch: refetchMeta } = useSubmissions({
    type: 'correct',
    per_page: 1, // Just to get metadata
  });
  
  // Calculate last page to get most recent submissions
  const totalSubmissions = submissionsMetaData?.meta?.pagination?.total || 0;
  const perPage = 50;
  const lastPage = totalSubmissions > 0 ? Math.max(1, Math.ceil(totalSubmissions / perPage)) : 1;
  
  // Fetch the last page (most recent submissions)
  const { data: submissionsData, isLoading: submissionsLoading, isError: submissionsError, error: submissionsErrorObj, refetch: refetchSubmissions } = useSubmissions({
    type: 'correct',
    per_page: perPage,
    page: lastPage,
  });
  const { data: ctfName, isLoading: ctfNameLoading } = useCtfName();
  const { data: endTime, isLoading: endTimeLoading } = useCtfEnd();
  const { firstBloodData, showAnimation, checkChallenges, hideAnimation } = useFirstBloodDetection();
  const { 
    firstPlaceChangeData, 
    showLiquidAnimation, 
    checkLeaderboardChange, 
    hideLiquidAnimation 
  } = useFirstPlaceDetection();
  const [currentPage, setCurrentPage] = useState(1);
  const [challengesPage, setChallengesPage] = useState(1);
  const [firstBloods, setFirstBloods] = useState<Map<number, number>>(new Map());
  const [firstBloodUsers, setFirstBloodUsers] = useState<Map<number, {id: number, name: string}>>(new Map());
  const [currentTab, setCurrentTab] = useState("scoreboard");
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState<number | null>(null);
  const [refreshCountdown, setRefreshCountdown] = useState(0);
  const [dynamicItemsPerPage, setDynamicItemsPerPage] = useState(10);
  const [dynamicChallengesPerPage, setDynamicChallengesPerPage] = useState(10);
  const [analyticsFontSizes, setAnalyticsFontSizes] = useState({
    title: 'text-xs',
    description: 'text-[10px]',
    body: 'text-xs',
    statNumber: 'text-lg',
    statLabel: 'text-[10px]',
    badge: 'text-[10px]'
  });
  const tabs = ["scoreboard", "challenges", "analytics"];

  // Detect authentication errors
  useEffect(() => {
    const hasAuthError = 
      (isError && error?.message?.includes('Unauthorized')) ||
      (challengesError && String(challengesError)?.includes('Unauthorized'));
    
    setShowAuthWarning(isConfigured && hasAuthError);
  }, [isError, error, challengesError, isConfigured]);

  // Auto-rotate tabs
  useEffect(() => {
    if (!config.autoRotate || !isConfigured) return;
    
    const rotationInterval = setInterval(() => {
      setCurrentTab((prevTab) => {
        const currentIndex = tabs.indexOf(prevTab);
        const nextIndex = (currentIndex + 1) % tabs.length;
        return tabs[nextIndex];
      });
    }, 10000); // Rotate every 10 seconds

    return () => clearInterval(rotationInterval);
  }, [config.autoRotate, isConfigured]);

  // Refresh countdown timer
  useEffect(() => {
    if (!isConfigured) return;

    const intervalSeconds = Math.floor(config.refetchInterval / 1000);
    setRefreshCountdown(intervalSeconds);

    const countdownInterval = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          return intervalSeconds; // Reset to full interval
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [config.refetchInterval, isConfigured]);

  useEffect(() => {
    if (!challenges || !Array.isArray(challenges)) return;
    checkChallenges(challenges);
  }, [challenges, checkChallenges]);

  useEffect(() => {
    const loadFirstBloods = async () => {
      if (!Array.isArray(challenges) || !isConfigured) return;
      
      const solvedChallenges = challenges.filter(challenge => challenge.solves > 0);
      const newFirstBloods = new Map<number, number>();
      
      for (const challenge of solvedChallenges) {
        try {
          const response = await getChallengeSolves(config, challenge.id);
          
          if (response.data && response.data.length > 0) {
            const firstSolve = response.data[0];
            newFirstBloods.set(challenge.id, firstSolve.account_id);
            
            const userInfo = {
              id: firstSolve.account_id,
              name: firstSolve.name
            };
            setFirstBloodUsers(prev => new Map(prev).set(challenge.id, userInfo));
          }
        } catch {
          // Silently handle error for first blood fetching
        }
      }
      
      setFirstBloods(newFirstBloods);
    };
    
    loadFirstBloods();
  }, [challenges, isConfigured, config]);
  
  useEffect(() => {
    checkLeaderboardChange(scoreboardResponse?.data);
  }, [scoreboardResponse?.data, checkLeaderboardChange]);
  
  const allusers = scoreboardResponse?.data ? Object.entries(scoreboardResponse.data).map(([pos, entry]: [string, ScoreboardEntry]) => {
    const solves = Array.isArray(entry.solves) ? entry.solves : [];
    
    // Filter out invalid solves - only keep solves for challenges that exist in the challenges list
    const validSolves = solves.filter((solve: ScoreboardEntry['solves'][0]) => {
      // Filter out solves with null or undefined challenge_id
      if (!solve.challenge_id || solve.challenge_id === null || solve.challenge_id === undefined) {
        return false;
      }
      
      // If we have the challenges list, verify the challenge exists
      if (challenges && Array.isArray(challenges)) {
        return challenges.some((c: Challenge) => c.id === solve.challenge_id);
      }
      // If we don't have challenges list yet, keep all solves (they'll be validated later)
      return true;
    });
    
    const userFirstBloods = validSolves.filter((solve: ScoreboardEntry['solves'][0]) => {
      return firstBloods.get(solve.challenge_id) === entry.id;
    }).length;
    
    return {
      rank: parseInt(pos),
      name: entry.name,
      score: entry.score,
      solves: validSolves,
      solvedChallenges: validSolves.length,
      firstBloods: userFirstBloods,
      account_id: entry.id,
      last_solve: validSolves.length > 0 ? validSolves.sort((a: ScoreboardEntry['solves'][0], b: ScoreboardEntry['solves'][0]) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0].date : null
    };
  }) : [];

  // Calculate dynamic items per page based on viewport height
  useEffect(() => {
    const calculateItemsPerPage = () => {
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Detect mobile/tablet - use more conservative calculations
      const isMobile = viewportWidth < 640;
      const isTablet = viewportWidth >= 640 && viewportWidth < 1024;
      
      // Estimate heights of fixed elements based on responsive classes
      // Header: py-3 sm:py-4 md:py-5 lg:py-6 (12px/16px/20px/24px top+bottom) + title height
      let headerHeight = 100; // More conservative for mobile
      if (viewportWidth >= 640) headerHeight = 90; // sm
      if (viewportWidth >= 768) headerHeight = 100; // md
      if (viewportWidth >= 1024) headerHeight = 110; // lg
      
      // Tabs: h-6 sm:h-7 md:h-8 lg:h-9 xl:h-10 (24px/28px/32px/36px/40px) + margin
      let tabsHeight = 40; // More conservative for mobile
      if (viewportWidth >= 640) tabsHeight = 35; // sm
      if (viewportWidth >= 768) tabsHeight = 40; // md
      if (viewportWidth >= 1024) tabsHeight = 45; // lg
      if (viewportWidth >= 1280) tabsHeight = 50; // xl
      
      // Pagination: estimated height (more on mobile due to wrapping)
      const paginationHeight = isMobile ? 70 : (isTablet ? 60 : 50);
      
      // Card padding: p-1.5 sm:p-2 md:p-2.5 lg:p-3 xl:p-4 (6px/8px/10px/12px/16px top+bottom)
      let cardPadding = 12;
      if (viewportWidth >= 640) cardPadding = 16; // sm
      if (viewportWidth >= 768) cardPadding = 20; // md
      if (viewportWidth >= 1024) cardPadding = 24; // lg
      if (viewportWidth >= 1280) cardPadding = 32; // xl
      
      // Table header: h-7 sm:h-8 md:h-9 lg:h-10 (28px/32px/36px/40px)
      let tableHeaderHeight = 28;
      if (viewportWidth >= 640) tableHeaderHeight = 32; // sm
      if (viewportWidth >= 768) tableHeaderHeight = 36; // md
      if (viewportWidth >= 1024) tableHeaderHeight = 40; // lg
      
      // Calculate available height for table rows (add buffer for mobile browser chrome)
      const mobileBuffer = isMobile ? 50 : (isTablet ? 30 : 0);
      const availableHeight = Math.max(200, viewportHeight - headerHeight - tabsHeight - paginationHeight - cardPadding - tableHeaderHeight - mobileBuffer);
      
      // Estimate row height based on breakpoints (h-7 sm:h-8 md:h-9 lg:h-10)
      let rowHeight = 28; // h-7 = 28px
      if (viewportWidth >= 640) rowHeight = 32; // sm:h-8 = 32px
      if (viewportWidth >= 768) rowHeight = 36; // md:h-9 = 36px
      if (viewportWidth >= 1024) rowHeight = 40; // lg:h-10 = 40px
      
      // Calculate how many rows fit (subtract 1 for buffer)
      const rowsThatFit = Math.max(1, Math.floor(availableHeight / rowHeight) - 1);
      
      // Set items per page: more conservative minimums for mobile/tablet
      const minItems = isMobile ? 5 : (isTablet ? 8 : 10);
      const calculated = Math.max(minItems, Math.min(rowsThatFit, 100));
      setDynamicItemsPerPage(calculated);
      setDynamicChallengesPerPage(calculated);
    };

    // Calculate on mount, resize, and tab change
    calculateItemsPerPage();
    window.addEventListener('resize', calculateItemsPerPage);
    
    return () => window.removeEventListener('resize', calculateItemsPerPage);
  }, [currentTab]);

  // Calculate dynamic font sizes for analytics based on viewport
  useEffect(() => {
    const calculateAnalyticsFontSizes = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Detect mobile/tablet - use more conservative font sizes
      const isMobile = viewportWidth < 640;
      const isTablet = viewportWidth >= 640 && viewportWidth < 1024;
      
      // Base sizes on viewport dimensions - more conservative for mobile/tablet
      // For title (CardTitle)
      let titleSize = 'text-xs'; // 12px - default for mobile
      if (isMobile) {
        titleSize = 'text-xs'; // Keep small on mobile
      } else if (isTablet) {
        titleSize = viewportHeight >= 600 ? 'text-sm' : 'text-xs'; // 14px on tablet if enough height
      } else {
        // Desktop
        if (viewportHeight >= 600) titleSize = 'text-sm'; // 14px
        if (viewportHeight >= 700) titleSize = 'text-base'; // 16px
        if (viewportHeight >= 800) titleSize = 'text-lg'; // 18px
        if (viewportHeight >= 900) titleSize = 'text-xl'; // 20px
      }
      
      // For description (CardDescription)
      let descriptionSize = 'text-[10px]'; // 10px
      if (isMobile) {
        descriptionSize = 'text-[10px]'; // Keep small on mobile
      } else if (isTablet) {
        descriptionSize = viewportHeight >= 600 ? 'text-xs' : 'text-[10px]'; // 12px on tablet if enough height
      } else {
        if (viewportHeight >= 600) descriptionSize = 'text-xs'; // 12px
        if (viewportHeight >= 800) descriptionSize = 'text-sm'; // 14px
      }
      
      // For body text (user names, category names)
      let bodySize = 'text-xs'; // 12px
      if (isMobile) {
        bodySize = 'text-xs'; // Keep small on mobile
      } else if (isTablet) {
        bodySize = viewportHeight >= 600 ? 'text-sm' : 'text-xs'; // 14px on tablet if enough height
      } else {
        if (viewportHeight >= 600) bodySize = 'text-sm'; // 14px
        if (viewportHeight >= 800) bodySize = 'text-base'; // 16px
      }
      
      // For stat numbers - more conservative scaling
      let statNumberSize = 'text-lg'; // 18px
      if (isMobile) {
        statNumberSize = 'text-lg'; // Keep reasonable on mobile
      } else if (isTablet) {
        statNumberSize = viewportHeight >= 600 ? 'text-xl' : 'text-lg'; // 20px on tablet if enough height
        if (viewportHeight >= 700) statNumberSize = 'text-2xl'; // 24px
      } else {
        // Desktop
        if (viewportHeight >= 600) statNumberSize = 'text-xl'; // 20px
        if (viewportHeight >= 700) statNumberSize = 'text-2xl'; // 24px
        if (viewportHeight >= 800) statNumberSize = 'text-3xl'; // 30px
        if (viewportHeight >= 900) statNumberSize = 'text-4xl'; // 36px
      }
      
      // For stat labels
      let statLabelSize = 'text-[10px]'; // 10px
      if (isMobile) {
        statLabelSize = 'text-[10px]'; // Keep small on mobile
      } else if (isTablet) {
        statLabelSize = viewportHeight >= 600 ? 'text-xs' : 'text-[10px]'; // 12px on tablet if enough height
      } else {
        if (viewportHeight >= 600) statLabelSize = 'text-xs'; // 12px
        if (viewportHeight >= 800) statLabelSize = 'text-sm'; // 14px
      }
      
      // For badges
      let badgeSize = 'text-[10px]'; // 10px
      if (isMobile) {
        badgeSize = 'text-[10px]'; // Keep small on mobile
      } else if (isTablet) {
        badgeSize = viewportHeight >= 600 ? 'text-xs' : 'text-[10px]'; // 12px on tablet if enough height
      } else {
        if (viewportHeight >= 600) badgeSize = 'text-xs'; // 12px
        if (viewportHeight >= 800) badgeSize = 'text-sm'; // 14px
      }
      
      setAnalyticsFontSizes({
        title: titleSize,
        description: descriptionSize,
        body: bodySize,
        statNumber: statNumberSize,
        statLabel: statLabelSize,
        badge: badgeSize
      });
    };

    calculateAnalyticsFontSizes();
    window.addEventListener('resize', calculateAnalyticsFontSizes);
    
    return () => window.removeEventListener('resize', calculateAnalyticsFontSizes);
  }, []);

  const itemsPerPage = dynamicItemsPerPage;

  // Reset to page 1 when data changes to avoid being on a non-existent page
  useEffect(() => {
    setCurrentPage(1);
  }, [allusers.length]);

  const totalPages = Math.ceil(allusers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const users = allusers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleChallengesPageChange = (page: number) => setChallengesPage(page);

  const challengesPerPage = dynamicChallengesPerPage;
  const allChallenges = challenges || [];

  // Reset to page 1 when challenges data changes
  useEffect(() => {
    setChallengesPage(1);
  }, [allChallenges.length]);

  const totalChallengesPages = Math.ceil(allChallenges.length / challengesPerPage) || 1;
  const challengesStartIndex = (challengesPage - 1) * challengesPerPage;
  const challengesEndIndex = challengesStartIndex + challengesPerPage;
  const paginatedChallenges = allChallenges.slice(challengesStartIndex, challengesEndIndex);

  const calculateTimeLeft = (): string => {
    if (endTimeLoading || !endTime) return "Loading...";
    
    const now = Date.now() / 1000;
    const timeLeftSeconds = endTime - now;
    
    if (timeLeftSeconds <= 0) return "Ended";
    
    const days = Math.floor(timeLeftSeconds / (60 * 60 * 24));
    const hours = Math.floor((timeLeftSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((timeLeftSeconds % (60 * 60)) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const processedScoreboard = fullScoreboard ? fullScoreboard.map((entry: ScoreboardEntry) => {
    // Filter out invalid solves - only keep solves for challenges that exist in the challenges list
    const validSolves = Array.isArray(entry.solves) ? entry.solves.filter((solve: ScoreboardEntry['solves'][0]) => {
      // Filter out solves with null or undefined challenge_id
      if (!solve.challenge_id || solve.challenge_id === null || solve.challenge_id === undefined) {
        return false;
      }
      
      if (challenges && Array.isArray(challenges)) {
        return challenges.some((c: Challenge) => c.id === solve.challenge_id);
      }
      return true;
    }) : [];
    
    const userFirstBloods = validSolves.filter((solve: ScoreboardEntry['solves'][0]) => {
      return firstBloods.get(solve.challenge_id) === entry.id;
    }).length;
    
    return {
      ...entry,
      solves: validSolves,
      firstBloods: userFirstBloods,
      solvedChallenges: validSolves.length
    };
  }) : [];
  
  const totalUsers = fullScoreboard ? fullScoreboard.length : allusers.length;
  
  const usersWithPoints = processedScoreboard.length > 0
    ? processedScoreboard.filter((entry: ScoreboardEntry & {firstBloods: number, solvedChallenges: number}) => entry.score > 0).length
    : allusers.filter(user => user.score > 0).length;
  
  const averageScore = processedScoreboard.length > 0
    ? Math.round(processedScoreboard.reduce((sum: number, entry: ScoreboardEntry & {firstBloods: number, solvedChallenges: number}) => sum + entry.score, 0) / processedScoreboard.length)
    : allusers.length > 0
      ? Math.round(allusers.reduce((sum: number, user) => sum + user.score, 0) / allusers.length)
      : 0;
  
  const topScore = processedScoreboard.length > 0
    ? Math.max(...processedScoreboard.map((entry: ScoreboardEntry & {firstBloods: number, solvedChallenges: number}) => entry.score))
    : allusers[0]?.score || 0;
    
  const totalFirstBloods = processedScoreboard.length > 0
    ? processedScoreboard.reduce((sum: number, user: ScoreboardEntry & {firstBloods: number, solvedChallenges: number}) => sum + user.firstBloods, 0)
    : allusers.reduce((sum: number, user) => sum + user.firstBloods, 0);

  const stats = {
    totalusers: totalUsers,
    usersWithPoints: usersWithPoints,
    totalChallenges: challenges?.length || 0,
    totalSubmissions: submissionsData?.meta.pagination.total || 0,
    averageScore: averageScore,
    topScore: topScore,
    timeLeft: calculateTimeLeft(),
    totalFirstBloods: totalFirstBloods
  };

  return (
    <div className="min-h-screen sm:h-screen overflow-y-auto sm:overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex flex-col">
      <DynamicTitle />
      {/* Maximize screen usage - remove max-width constraints */}
      <div className="w-full flex-1 sm:flex-1 min-h-0 sm:min-h-0 flex flex-col">
        <div className="px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 flex-shrink-0">
          <div className="text-center py-3 sm:py-4 md:py-5 lg:py-6 relative">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold text-gray-900 dark:text-white">
              {ctfNameLoading ? (
                <Skeleton className="h-8 sm:h-10 lg:h-14 xl:h-16 2xl:h-20 w-48 sm:w-64 lg:w-80 xl:w-96 2xl:w-[32rem] mx-auto" />
              ) : (
                ctfName || 'CTF Scoreboard'
              )}
            </h1>
            <div className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 lg:right-5 xl:right-6 flex items-center gap-2 sm:gap-2.5 md:gap-3">
              {isConfigured && (
                <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground bg-muted px-2 sm:px-2.5 md:px-3 lg:px-3.5 py-1 sm:py-1.5 md:py-2 rounded-full shadow-sm">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                  <span className="font-medium tabular-nums">{refreshCountdown}s</span>
                </div>
              )}
              {process.env.NEXT_PUBLIC_SHOW_DEVTOOLS === 'true' && (
                <DevTools />
              )}
              <ConfigDialog />
            </div>
          </div>

        {/* Authentication warning banner */}
        {showAuthWarning && (
          <AuthWarningBanner 
            isVisible={showAuthWarning}
            onOpenSettings={() => {
              // Trigger the settings dialog to open
              const settingsButton = document.querySelector('[aria-label="Settings"]') as HTMLButtonElement;
              settingsButton?.click();
            }}
          />
        )}

        {!isConfigured ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="text-center py-8 sm:py-16 px-4">
              <Settings className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6 text-muted-foreground" />
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Configuration Required</h3>
              <p className="text-muted-foreground mb-4 sm:mb-6 text-base sm:text-lg">
                Please configure your CTFd API URL and token to view the scoreboard.
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Click the settings button in the top-right corner to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Main Layout: Left (Tabs Content) and Right (Stats + Submissions - Always Visible) */}
            <div className="flex flex-col lg:flex-row gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5 flex-1 sm:flex-1 min-h-0 sm:min-h-0">
              {/* Left Side - Tabbed Content (Scoreboard/Challenges/Analytics) - Takes more space */}
              <div className="w-full lg:w-[65%] flex flex-col min-h-0 sm:min-h-0">
                <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex flex-col flex-1 min-h-0">
                  <div className="mb-1 sm:mb-1.5 flex-shrink-0">
                    <TabsList className="grid w-full grid-cols-3 gap-0.5 sm:gap-1 h-6 sm:h-7 md:h-8 lg:h-9 xl:h-10">
                      <TabsTrigger value="scoreboard" className="text-[10px] sm:text-xs md:text-sm lg:text-base truncate">Scoreboard</TabsTrigger>
                      <TabsTrigger value="challenges" className="text-[10px] sm:text-xs md:text-sm lg:text-base truncate">Challenges</TabsTrigger>
                      <TabsTrigger value="analytics" className="text-[10px] sm:text-xs md:text-sm lg:text-base truncate">Analytics</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="scoreboard" className="flex-1 sm:flex-1 min-h-0 sm:min-h-0 flex flex-col mt-1 sm:mt-1.5">
                    <Card className="flex-1 sm:flex-1 min-h-0 sm:min-h-0 flex flex-col">
                      <CardContent className="p-1.5 sm:p-2 md:p-2.5 lg:p-3 xl:p-4 flex-1 sm:flex-1 flex flex-col min-h-0 sm:min-h-0 overflow-visible sm:overflow-hidden">
                        {isLoading ? (
                          <div className="p-2 sm:p-3">
                            <ScoreboardSkeleton />
                          </div>
                        ) : isError ? (
                          <div className="text-center text-red-500 py-8 px-4 lg:py-12 xl:py-16 2xl:py-20">
                            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-semibold mb-2 2xl:mb-4">Failed to load scoreboard</p>
                            <p className="text-xs sm:text-sm lg:text-base xl:text-lg 2xl:text-xl">{error?.message}</p>
                          </div>
                        ) : (
                          <div className="flex-1 min-h-0 overflow-visible sm:overflow-auto">
                            <Table className="w-full">
                              <TableHeader className="sticky top-0 bg-background z-10">
                                <TableRow className="h-7 sm:h-8 md:h-9 lg:h-10">
                                  <TableHead className="w-8 sm:w-10 md:w-12 lg:w-14 text-[10px] sm:text-xs md:text-sm lg:text-base">Rank</TableHead>
                                  <TableHead className="text-[10px] sm:text-xs md:text-sm lg:text-base min-w-0 max-w-[80px] sm:max-w-none">User</TableHead>
                                  <TableHead className="text-right text-[10px] sm:text-xs md:text-sm lg:text-base w-12 sm:w-16 md:w-20">Score</TableHead>
                                  <TableHead className="text-center min-w-[60px] sm:min-w-[80px] md:min-w-[120px] lg:min-w-[150px] xl:min-w-[200px]">
                                    <div className="flex items-center justify-center gap-0.5 sm:gap-1" title="Challenges solved">
                                      <Flag className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4" />
                                      <span className="hidden sm:inline text-[10px] sm:text-xs md:text-sm lg:text-base">Challenges</span>
                                    </div>
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                              {users.length > 0 ? (
                                <>
                                  {users.map((user) => (
                                    <TableRow key={user.account_id} className={`${user.rank <= 3 ? "bg-yellow-50 dark:bg-yellow-950/20" : ""} h-7 sm:h-8 md:h-9 lg:h-10`}>
                                      <TableCell className="font-medium text-[10px] sm:text-xs md:text-sm lg:text-base py-1 sm:py-1.5 md:py-2">
                                        <div className="flex items-center gap-0.5 sm:gap-1">
                                          {user.rank === 1 && <Trophy className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-yellow-500" />}
                                          {user.rank === 2 && <Trophy className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-gray-400" />}
                                          {user.rank === 3 && <Trophy className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-amber-600" />}
                                          {user.rank > 3 && `#${user.rank}`}
                                        </div>
                                      </TableCell>
                                      <TableCell className="font-semibold text-[10px] sm:text-xs md:text-sm lg:text-base py-1 sm:py-1.5 md:py-2 min-w-0 max-w-[80px] sm:max-w-none truncate">{user.name}</TableCell>
                                      <TableCell className="text-right font-mono text-[10px] sm:text-xs md:text-sm lg:text-base py-1 sm:py-1.5 md:py-2">{user.score.toLocaleString()}</TableCell>
                                      <TableCell className="text-center py-1 sm:py-1.5 md:py-2 min-w-0">
                                        <div className="flex flex-wrap gap-0.5 sm:gap-0.5 md:gap-1 justify-center items-center min-h-[16px] sm:min-h-[20px] md:min-h-[24px] max-w-full mx-auto" title={`${user.solvedChallenges} challenges solved`}>
                                          {user.solves && Array.isArray(user.solves) ? (
                                            user.solves
                                              .filter((solve: ScoreboardEntry['solves'][0]) => solve.challenge_id) // Extra safety check
                                              .map((solve: ScoreboardEntry['solves'][0]) => {
                                              const challenge = challenges?.find((c: Challenge) => c.id === solve.challenge_id);
                                              if (!challenge) {
                                                return null;
                                              }
                                              const challengeName = challenge.name;
                                              const isFirstBlood = firstBloods.get(solve.challenge_id) === user.account_id;
                                              return (
                                                <div
                                                  key={solve.challenge_id}
                                                  title={`${challengeName}${isFirstBlood ? ' (First Blood!)' : ''} - Solved on ${new Date(solve.date).toLocaleString()}`}
                                                  className={`cursor-help flex items-center justify-center p-0.5 rounded transition-colors ${
                                                    isFirstBlood 
                                                      ? 'hover:bg-red-100 dark:hover:bg-red-900/20' 
                                                      : 'hover:bg-green-100 dark:hover:bg-green-900/20'
                                                  }`}
                                                >
                                                  {isFirstBlood ? (
                                                    <Droplets className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-red-500" />
                                                  ) : (
                                                    <Flag className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-green-500" />
                                                  )}
                                                </div>
                                              );
                                            })
                                          ) : user.solvedChallenges > 0 ? (
                                            Array.from({ length: user.solvedChallenges }, (_, i) => (
                                              <div
                                                key={i}
                                                title="Challenge solved"
                                                className="cursor-help flex items-center justify-center p-0.5 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors"
                                              >
                                                <Flag className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 text-green-500" />
                                              </div>
                                            ))
                                          ) : (
                                            <span className="text-muted-foreground text-[10px] sm:text-sm">No solves</span>
                                          )}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                  {/* Add empty rows to fill up to itemsPerPage */}
                                  {users.length < itemsPerPage && Array.from({ length: itemsPerPage - users.length }).map((_, i) => (
                                    <TableRow key={`empty-${i}`} className="opacity-30">
                                      <TableCell className="font-medium text-sm py-2">
                                        <div className="flex items-center gap-2">
                                          #{startIndex + users.length + i + 1}
                                        </div>
                                      </TableCell>
                                      <TableCell className="font-semibold text-sm text-muted-foreground py-2">—</TableCell>
                                      <TableCell className="text-right font-mono text-base text-muted-foreground py-2">—</TableCell>
                                      <TableCell className="text-center py-2">
                                        <span className="text-muted-foreground text-sm">—</span>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </>
                              ) : (
                                Array.from({ length: itemsPerPage }).map((_, i) => (
                                  <TableRow key={`empty-${i}`} className="opacity-30">
                                    <TableCell className="font-medium text-sm">
                                      <div className="flex items-center gap-2">
                                        #{i + 1}
                                      </div>
                                    </TableCell>
                                    <TableCell className="font-semibold text-sm text-muted-foreground">—</TableCell>
                                    <TableCell className="text-right font-mono text-base text-muted-foreground">—</TableCell>
                                    <TableCell className="text-center">
                                      <span className="text-muted-foreground text-sm">—</span>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                          </div>
                        )}
                        {allusers.length > 0 && (
                          <div className="flex flex-col sm:flex-row items-center sm:items-center sm:justify-between gap-2 sm:gap-3 mt-1 sm:mt-1.5 px-1 sm:px-2 flex-shrink-0 border-t pt-1 sm:pt-1.5">
                            <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground order-2 sm:order-1 text-center sm:text-left">
                              Showing {startIndex + 1} to {Math.min(endIndex, allusers.length)} of {allusers.length} users
                            </div>
                            {allusers.length > itemsPerPage && (
                              <div className="order-1 sm:order-2 w-full sm:w-auto flex justify-center overflow-x-auto">
                                <Pagination className="w-auto">
                                  <PaginationContent className="flex-wrap sm:flex-nowrap">
                                    <PaginationItem key="prev">
                                      <PaginationPrevious 
                                        href="#"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          if (currentPage > 1) handlePageChange(currentPage - 1);
                                        }}
                                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                                      />
                                    </PaginationItem>
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                      let pageNum;
                                      if (totalPages <= 5) {
                                        pageNum = i + 1;
                                      } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                      } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                      } else {
                                        pageNum = currentPage - 2 + i;
                                      }
                                      return (
                                        <PaginationItem key={pageNum}>
                                          <PaginationLink
                                            href="#"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              handlePageChange(pageNum);
                                            }}
                                            isActive={currentPage === pageNum}
                                          >
                                            {pageNum}
                                          </PaginationLink>
                                        </PaginationItem>
                                      );
                                    })}
                                    {totalPages > 5 && currentPage < totalPages - 2 && (
                                      <PaginationItem key="ellipsis">
                                        <PaginationEllipsis />
                                      </PaginationItem>
                                    )}
                                    <PaginationItem key="next">
                                      <PaginationNext 
                                        href="#"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          if (currentPage < totalPages) handlePageChange(currentPage + 1);
                                        }}
                                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                                      />
                                    </PaginationItem>
                                  </PaginationContent>
                                </Pagination>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="challenges" className="flex-1 sm:flex-1 min-h-0 sm:min-h-0 flex flex-col mt-1 sm:mt-1.5">
                <Card className="flex-1 sm:flex-1 min-h-0 sm:min-h-0 flex flex-col">
                  <CardContent className="p-1.5 sm:p-2 md:p-2.5 lg:p-3 xl:p-4 flex-1 sm:flex-1 flex flex-col min-h-0 sm:min-h-0 overflow-visible sm:overflow-hidden">
                    {challengesLoading ? (
                      <div className="space-y-1 sm:space-y-1.5">
                        {[...Array(12)].map((_, i) => (
                          <Skeleton key={i} className="h-12 sm:h-14 w-full" />
                        ))}
                      </div>
                    ) : challengesError ? (
                      <div className="text-center text-red-500 py-6 sm:py-8 px-4">
                        <Flag className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 sm:mb-3" />
                        <p className="text-xs sm:text-sm font-semibold mb-1">Failed to load challenges</p>
                        <p className="text-[10px] sm:text-xs">Please check your API configuration</p>
                      </div>
                    ) : allChallenges.length > 0 ? (
                      <>
                        <div className="flex-1 min-h-0 overflow-visible sm:overflow-auto">
                          <Table>
                            <TableHeader className="sticky top-0 bg-background z-10">
                              <TableRow className="h-7 sm:h-8 md:h-9 lg:h-10">
                                <TableHead className="text-[10px] sm:text-xs md:text-sm lg:text-base min-w-0">Challenge</TableHead>
                                <TableHead className="text-center text-[10px] sm:text-xs md:text-sm lg:text-base w-20 sm:w-24 md:w-28">Category</TableHead>
                                <TableHead className="text-right text-[10px] sm:text-xs md:text-sm lg:text-base w-16 sm:w-20">Points</TableHead>
                                <TableHead className="text-center text-[10px] sm:text-xs md:text-sm lg:text-base w-20 sm:w-24">Solves</TableHead>
                                <TableHead className="text-center text-[10px] sm:text-xs md:text-sm lg:text-base w-24 sm:w-28 hidden sm:table-cell">First Blood</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedChallenges.length > 0 ? (
                                <>
                                  {paginatedChallenges.map((challenge) => {
                                    const firstBloodInfo = firstBloodUsers.get(challenge.id);
                                    const isSolved = challenge.solved_by_me;
                                    
                                    return (
                                      <TableRow 
                                        key={challenge.id} 
                                        className={`h-7 sm:h-8 md:h-9 lg:h-10 cursor-pointer hover:bg-accent/50 ${isSolved ? 'bg-green-50/50 dark:bg-green-950/10' : ''}`}
                                        onClick={() => setSelectedChallengeId(challenge.id)}
                                      >
                                        <TableCell className="py-1 sm:py-1.5 md:py-2 min-w-0">
                                          <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                                            <span className="font-medium text-[10px] sm:text-xs md:text-sm lg:text-base truncate">{challenge.name}</span>
                                            {isSolved && (
                                              <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-green-500 flex-shrink-0" />
                                            )}
                                          </div>
                                        </TableCell>
                                        <TableCell className="py-1 sm:py-1.5 md:py-2 text-center">
                                          <Badge className={`${getCategoryColor(challenge.category)} text-[9px] sm:text-[10px] md:text-xs px-1.5 sm:px-2 py-0.5`}>
                                            {challenge.category}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="py-1 sm:py-1.5 md:py-2 text-right">
                                          <span className="font-mono font-semibold text-[10px] sm:text-xs md:text-sm lg:text-base text-primary">
                                            {challenge.value > 0 ? challenge.value : (
                                              <Badge variant="secondary" className="text-[9px] sm:text-[10px]">Practice</Badge>
                                            )}
                                          </span>
                                        </TableCell>
                                        <TableCell className="py-1 sm:py-1.5 md:py-2 text-center">
                                          <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                                            <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 flex-shrink-0" />
                                            <span>{challenge.solves || 0}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="py-1 sm:py-1.5 md:py-2 text-center hidden sm:table-cell">
                                          {firstBloodInfo ? (
                                            <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] md:text-xs text-red-500">
                                              <Droplets className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 flex-shrink-0" />
                                              <span className="truncate max-w-[80px] sm:max-w-[100px] md:max-w-[120px]">{firstBloodInfo.name}</span>
                                            </div>
                                          ) : (
                                            <span className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">—</span>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                  {/* Add empty rows to fill up to challengesPerPage for consistent height */}
                                  {paginatedChallenges.length < challengesPerPage && Array.from({ length: challengesPerPage - paginatedChallenges.length }).map((_, i) => (
                                    <TableRow key={`empty-${i}`} className="opacity-30 h-7 sm:h-8 md:h-9 lg:h-10">
                                      <TableCell className="font-medium text-[10px] sm:text-xs md:text-sm lg:text-base py-1 sm:py-1.5 md:py-2">
                                        <span className="text-muted-foreground">—</span>
                                      </TableCell>
                                      <TableCell className="text-center py-1 sm:py-1.5 md:py-2">
                                        <span className="text-muted-foreground text-[10px] sm:text-xs">—</span>
                                      </TableCell>
                                      <TableCell className="text-right py-1 sm:py-1.5 md:py-2">
                                        <span className="text-muted-foreground text-[10px] sm:text-xs">—</span>
                                      </TableCell>
                                      <TableCell className="text-center py-1 sm:py-1.5 md:py-2">
                                        <span className="text-muted-foreground text-[10px] sm:text-xs">—</span>
                                      </TableCell>
                                      <TableCell className="text-center py-1 sm:py-1.5 md:py-2 hidden sm:table-cell">
                                        <span className="text-muted-foreground text-[10px] sm:text-xs">—</span>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </>
                              ) : (
                                Array.from({ length: challengesPerPage }).map((_, i) => (
                                  <TableRow key={`empty-${i}`} className="opacity-30 h-7 sm:h-8 md:h-9 lg:h-10">
                                    <TableCell className="font-medium text-[10px] sm:text-xs md:text-sm lg:text-base py-1 sm:py-1.5 md:py-2">
                                      <span className="text-muted-foreground">—</span>
                                    </TableCell>
                                    <TableCell className="text-center py-1 sm:py-1.5 md:py-2">
                                      <span className="text-muted-foreground text-[10px] sm:text-xs">—</span>
                                    </TableCell>
                                    <TableCell className="text-right py-1 sm:py-1.5 md:py-2">
                                      <span className="text-muted-foreground text-[10px] sm:text-xs">—</span>
                                    </TableCell>
                                    <TableCell className="text-center py-1 sm:py-1.5 md:py-2">
                                      <span className="text-muted-foreground text-[10px] sm:text-xs">—</span>
                                    </TableCell>
                                    <TableCell className="text-center py-1 sm:py-1.5 md:py-2 hidden sm:table-cell">
                                      <span className="text-muted-foreground text-[10px] sm:text-xs">—</span>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                        
                        {allChallenges.length > 0 && (
                          <div className="flex flex-col sm:flex-row items-center sm:items-center sm:justify-between gap-2 sm:gap-3 mt-1 sm:mt-1.5 px-1 sm:px-2 flex-shrink-0 border-t pt-1 sm:pt-1.5">
                            <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground order-2 sm:order-1 text-center sm:text-left">
                              {challengesStartIndex + 1}-{Math.min(challengesEndIndex, allChallenges.length)} of {allChallenges.length} challenges
                            </div>
                            {allChallenges.length > challengesPerPage && (
                              <div className="order-1 sm:order-2 w-full sm:w-auto flex justify-center overflow-x-auto">
                                <Pagination className="w-auto">
                                  <PaginationContent className="flex-wrap sm:flex-nowrap">
                                    <PaginationItem key="prev-challenges">
                                      <PaginationPrevious 
                                        href="#"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          if (challengesPage > 1) handleChallengesPageChange(challengesPage - 1);
                                        }}
                                        className={challengesPage === 1 ? "pointer-events-none opacity-50" : ""}
                                      />
                                    </PaginationItem>
                                    
                                    {Array.from({ length: Math.min(totalChallengesPages, 5) }, (_, i) => {
                                      let pageNum;
                                      if (totalChallengesPages <= 5) {
                                        pageNum = i + 1;
                                      } else if (challengesPage <= 3) {
                                        pageNum = i + 1;
                                      } else if (challengesPage >= totalChallengesPages - 2) {
                                        pageNum = totalChallengesPages - 4 + i;
                                      } else {
                                        pageNum = challengesPage - 2 + i;
                                      }
                                      
                                      return (
                                        <PaginationItem key={pageNum}>
                                          <PaginationLink
                                            href="#"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              handleChallengesPageChange(pageNum);
                                            }}
                                            isActive={challengesPage === pageNum}
                                          >
                                            {pageNum}
                                          </PaginationLink>
                                        </PaginationItem>
                                      );
                                    })}
                                    
                                    {totalChallengesPages > 5 && challengesPage < totalChallengesPages - 2 && (
                                      <PaginationItem key="ellipsis-challenges">
                                        <PaginationEllipsis />
                                      </PaginationItem>
                                    )}
                                    
                                    <PaginationItem key="next-challenges">
                                      <PaginationNext 
                                        href="#"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          if (challengesPage < totalChallengesPages) handleChallengesPageChange(challengesPage + 1);
                                        }}
                                        className={challengesPage === totalChallengesPages ? "pointer-events-none opacity-50" : ""}
                                      />
                                    </PaginationItem>
                                  </PaginationContent>
                                </Pagination>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Flag className="h-8 w-8 mx-auto mb-3" />
                        <h3 className="text-sm font-semibold mb-1">No Challenges Available</h3>
                        <p className="text-xs">No challenges have been published yet.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="flex-1 min-h-0 flex flex-col mt-1 sm:mt-1.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 flex-1 min-h-0 overflow-visible sm:overflow-auto pb-4 sm:pb-0">
                  <Card className="flex flex-col h-full">
                    <CardHeader className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 flex-shrink-0">
                      <CardTitle className={analyticsFontSizes.title}>Top Performing Users</CardTitle>
                      <CardDescription className={analyticsFontSizes.description}>Users with highest scores</CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-3 md:px-4 flex-1">
                      <div className="space-y-2">
                        {allusers.slice(0, 5).map((user, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                              <span className={`font-medium ${analyticsFontSizes.body} truncate`}>{user.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className={`${analyticsFontSizes.body} text-gray-600 dark:text-gray-400`}>{user.score} pts</span>
                              <Badge variant="outline" className={`${analyticsFontSizes.badge} h-4`}>#{user.rank}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="flex flex-col h-full">
                    <CardHeader className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 flex-shrink-0">
                      <CardTitle className={analyticsFontSizes.title}>Challenge Statistics</CardTitle>
                      <CardDescription className={analyticsFontSizes.description}>Overview of challenges and solving progress</CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-3 md:px-4 flex-1">
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div>
                            <div className={`${analyticsFontSizes.statNumber} font-bold text-blue-600`}>{stats.totalChallenges}</div>
                            <div className={`${analyticsFontSizes.statLabel} text-gray-600 dark:text-gray-400`}>Total Challenges</div>
                          </div>
                          <div>
                            <div className={`${analyticsFontSizes.statNumber} font-bold text-green-600`}>
                              {challenges ? Object.keys(challenges.reduce((acc, c) => ({ ...acc, [c.category]: true }), {})).length : 0}
                            </div>
                            <div className={`${analyticsFontSizes.statLabel} text-gray-600 dark:text-gray-400`}>Categories</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div>
                            <div className={`${analyticsFontSizes.statNumber} font-bold text-orange-600`}>
                              {challenges ? Math.round(challenges.reduce((sum, c) => sum + c.solves, 0) / Math.max(challenges.length, 1)) : 0}
                            </div>
                            <div className={`${analyticsFontSizes.statLabel} text-gray-600 dark:text-gray-400`}>Average Solves</div>
                          </div>
                          <div>
                            <div className={`${analyticsFontSizes.statNumber} font-bold text-purple-600`}>
                              {challenges ? Math.max(...challenges.map(c => c.solves), 0) : 0}
                            </div>
                            <div className={`${analyticsFontSizes.statLabel} text-gray-600 dark:text-gray-400`}>Most Solved</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="flex flex-col h-full">
                    <CardHeader className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 flex-shrink-0">
                      <CardTitle className={analyticsFontSizes.title}>Competition Statistics</CardTitle>
                      <CardDescription className={analyticsFontSizes.description}>Overview of current competition state</CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-3 md:px-4 flex-1">
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div>
                            <div className={`${analyticsFontSizes.statNumber} font-bold text-blue-600`}>{stats.totalusers}</div>
                            <div className={`${analyticsFontSizes.statLabel} text-gray-600`}>Active Users</div>
                          </div>
                          <div>
                            <div className={`${analyticsFontSizes.statNumber} font-bold text-green-600`}>{stats.topScore}</div>
                            <div className={`${analyticsFontSizes.statLabel} text-gray-600`}>Highest Score</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div>
                            <div className={`${analyticsFontSizes.statNumber} font-bold text-orange-600`}>{stats.averageScore}</div>
                            <div className={`${analyticsFontSizes.statLabel} text-gray-600`}>Average Score</div>
                          </div>
                          <div>
                            <div className={`${analyticsFontSizes.statNumber} font-bold text-purple-600`}>{stats.usersWithPoints}</div>
                            <div className={`${analyticsFontSizes.statLabel} text-gray-600`}>Users with Points</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="flex flex-col h-full">
                    <CardHeader className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 flex-shrink-0">
                      <CardTitle className={analyticsFontSizes.title}>Challenge Categories</CardTitle>
                      <CardDescription className={analyticsFontSizes.description}>Distribution of challenges by category</CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-3 md:px-4 flex-1">
                      <div className="space-y-2">
                        {challenges && Object.entries(
                          challenges.reduce((acc, challenge) => {
                            acc[challenge.category] = (acc[challenge.category] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([category, count]) => (
                          <div key={category} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${getCategoryDotColor(category)} rounded-full flex-shrink-0`}></div>
                              <span className={`font-medium ${analyticsFontSizes.body} truncate`}>{category}</span>
                            </div>
                            <Badge variant="outline" className={`${analyticsFontSizes.badge} flex-shrink-0`}>{count} challenges</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Side - Recent Submissions (Always Visible) - Compact sidebar */}
          <div className="w-full lg:w-[35%] flex flex-col gap-1 sm:gap-1.5 md:gap-2 min-h-0">
            {/* Podium for Top 3 */}
            <div className="flex-shrink-0">
              <Podium 
                topThree={allusers.filter(user => user.rank <= 3).sort((a, b) => a.rank - b.rank)}
                isLoading={isLoading}
              />
            </div>
            
            {/* Recent Submissions Section */}
            <div className="flex-1 min-h-0">
              <RecentSubmissions
                submissions={submissionsData?.data || []}
                isLoading={submissionsLoading}
                isError={submissionsError}
                error={submissionsErrorObj}
                onRefresh={async () => {
                  // Refetch metadata first to recalculate last page, then refetch submissions
                  await refetchMeta();
                  refetchSubmissions();
                }}
                useExternalData={true}
              />
            </div>
          </div>
        </div>
            
            {firstBloodData && (
              <FirstBloodAnimation 
                isVisible={showAnimation}
                solve={firstBloodData.solve}
                challengeName={firstBloodData.challengeName}
                onClose={hideAnimation}
              />
            )}
            
            {firstPlaceChangeData && (
              <LiquidAnimation
                isVisible={showLiquidAnimation}
                onAnimationComplete={hideLiquidAnimation}
                previousLeader={firstPlaceChangeData.previousLeader}
                newLeader={firstPlaceChangeData.newLeader}
              />
            )}
            
            {/* Challenge Detail Dialog */}
            <Dialog open={selectedChallengeId !== null} onOpenChange={(open) => !open && setSelectedChallengeId(null)}>
              <DialogContent className="w-[95vw] sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {selectedChallengeId && allChallenges.find(c => c.id === selectedChallengeId)?.name || 'Challenge Details'}
                  </DialogTitle>
                </DialogHeader>
                {selectedChallengeId && <ChallengeDetailView challengeId={selectedChallengeId} />}
              </DialogContent>
            </Dialog>
          </>
        )}
        </div>
      </div>
    </div>
  );
}

function ScoreboardSkeleton() {
  return (
    <div className="space-y-1 sm:space-y-1.5">
      <Skeleton className="h-7 sm:h-8 md:h-9 lg:h-10 w-full" />
      {[...Array(10)].map((_, i) => (
        <Skeleton key={i} className="h-7 sm:h-8 md:h-9 lg:h-10 w-full" />
      ))}
    </div>
  );
}