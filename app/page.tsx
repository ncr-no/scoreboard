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
import { Trophy, Flag, Users, Clock, Target, TrendingUp, Settings, Droplets } from "lucide-react";
import { ConfigDialog } from '@/components/config-dialog';
import { DynamicTitle } from '@/components/dynamic-title';
import { ChallengeCard } from '@/components/page/challenge-card';
import { RecentSubmissions } from '@/components/page/recent-submissions';
import { FirstBloodAnimation } from '@/components/first-blood-animation';
import { LiquidAnimation } from '@/components/liquid-animation';
import { DevTools } from '@/components/dev-tools';
import { ScoreboardEntry, Challenge } from '@/types/ctfd';
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
  const { data: submissionsData } = useSubmissions({ 
    type: 'correct',
    per_page: 1
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
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentTab, setCurrentTab] = useState("scoreboard");
  const [autoRotate, setAutoRotate] = useState(false);
  const challengesPerPage = 9;
  const tabs = ["scoreboard", "submissions", "challenges", "analytics"];

  // Auto-rotate tabs
  useEffect(() => {
    if (!autoRotate || !isConfigured) return;
    
    const rotationInterval = setInterval(() => {
      setCurrentTab((prevTab) => {
        const currentIndex = tabs.indexOf(prevTab);
        const nextIndex = (currentIndex + 1) % tabs.length;
        return tabs[nextIndex];
      });
    }, 10000); // Rotate every 10 seconds

    return () => clearInterval(rotationInterval);
  }, [autoRotate, isConfigured]);

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

  const totalPages = Math.ceil(allusers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const users = allusers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleChallengesPageChange = (page: number) => setChallengesPage(page);

  const allChallenges = challenges || [];
  const totalChallengesPages = Math.ceil(allChallenges.length / challengesPerPage);
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
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <DynamicTitle />
      <div className="container mx-auto py-4 sm:py-8 px-2 sm:px-4">
        <div className="text-center mb-4 sm:mb-8 relative">
          <div className="absolute top-0 right-0 flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
            {isConfigured && (
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground bg-muted px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="hidden sm:inline">Auto-refresh:</span>
                <span className="sm:hidden">Refresh:</span>
                {config.refetchInterval / 1000}s
              </div>
            )}
            {process.env.NEXT_PUBLIC_SHOW_DEVTOOLS === 'true' && (
              <DevTools />
            )}
            <ConfigDialog />
          </div>
          {/* Add right padding on mobile to prevent title from overlapping with settings button, remove on larger screens where there's more space */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2 sm:gap-3 pr-20 sm:pr-0">
            {ctfNameLoading ? (
              <Skeleton className="h-8 sm:h-10 w-48 sm:w-64" />
            ) : (
              ctfName || 'CTF Scoreboard'
            )}
          </h1>
        </div>

        {!isConfigured ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="text-center py-16">
              <Settings className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
              <h3 className="text-2xl font-semibold mb-4">Configuration Required</h3>
              <p className="text-muted-foreground mb-6 text-lg">
                Please configure your CTFd API URL and token to view the scoreboard.
              </p>
              <p className="text-sm text-muted-foreground">
                Click the settings button in the top-right corner to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 mb-4 sm:mb-8">
              <Card>
                <CardContent className="p-2 sm:p-4 text-center">
                  <div className="flex items-center justify-center mb-1 sm:mb-2">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  </div>
                  <div className="text-lg sm:text-2xl font-bold">{stats.totalusers}</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Users</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 sm:p-4 text-center">
                  <div className="flex items-center justify-center mb-1 sm:mb-2">
                    <Flag className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  </div>
                  <div className="text-lg sm:text-2xl font-bold">{stats.totalChallenges}</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Challenges</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 sm:p-4 text-center">
                  <div className="flex items-center justify-center mb-1 sm:mb-2">
                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                  </div>
                  <div className="text-lg sm:text-2xl font-bold">{stats.totalSubmissions}</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Submissions</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 sm:p-4 text-center">
                  <div className="flex items-center justify-center mb-1 sm:mb-2">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                  </div>
                  <div className="text-lg sm:text-2xl font-bold">{stats.averageScore}</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Avg Score</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 sm:p-4 text-center">
                  <div className="flex items-center justify-center mb-1 sm:mb-2">
                    <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                  </div>
                  <div className="text-lg sm:text-2xl font-bold">{stats.topScore}</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Top Score</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 sm:p-4 text-center">
                  <div className="flex items-center justify-center mb-1 sm:mb-2">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  </div>
                  <div className="text-lg sm:text-2xl font-bold">{stats.timeLeft}</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Time Left</div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
                  <TabsTrigger value="scoreboard" className="text-xs sm:text-sm">Scoreboard</TabsTrigger>
                  <TabsTrigger value="submissions" className="text-xs sm:text-sm">Submissions</TabsTrigger>
                  <TabsTrigger value="challenges" className="text-xs sm:text-sm">Challenges</TabsTrigger>
                  <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
                </TabsList>
                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 text-xs rounded-md transition-colors whitespace-nowrap ${
                    autoRotate 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  title={autoRotate ? "Auto-rotation enabled (10s)" : "Enable auto-rotation"}
                >
                  <span className="hidden sm:inline">{autoRotate ? '🔄 Auto' : '▶️ Auto'}</span>
                  <span className="sm:hidden">{autoRotate ? '🔄' : '▶️'}</span>
                </button>
              </div>

              <TabsContent value="scoreboard" className="space-y-4">
                <Card>
                  <CardContent className="p-0 sm:p-6">
                    {isLoading ? (
                      <div className="p-4">
                        <ScoreboardSkeleton />
                      </div>
                    ) : isError ? (
                      <div className="text-center text-red-500 py-8 px-4">
                        <p className="text-base sm:text-lg font-semibold mb-2">Failed to load scoreboard</p>
                        <p className="text-xs sm:text-sm">{error?.message}</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12 sm:w-16">Rank</TableHead>
                              <TableHead>User</TableHead>
                              <TableHead className="text-right">Score</TableHead>
                              <TableHead className="text-center min-w-[120px] sm:min-w-[200px]">
                                <div className="flex items-center justify-center gap-1" title="Challenges solved">
                                  <div title="Challenges solved">
                                    <Flag className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </div>
                                  <span className="hidden sm:inline">Challenges</span>
                                  <span className="sm:hidden text-xs">Solved</span>
                                </div>
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                          {users.length > 0 ? users.map((user) => (
                            <TableRow key={user.account_id} className={user.rank <= 3 ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  {user.rank === 1 && <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />}
                                  {user.rank === 2 && <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />}
                                  {user.rank === 3 && <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />}
                                  {user.rank > 3 && `#${user.rank}`}
                                </div>
                              </TableCell>
                              <TableCell className="font-semibold text-xs sm:text-sm">{user.name}</TableCell>
                              <TableCell className="text-right font-mono text-sm sm:text-lg">{user.score.toLocaleString()}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-wrap gap-0.5 sm:gap-1 justify-center items-center min-h-[24px] sm:min-h-[32px] max-w-lg mx-auto py-1 sm:py-2" title={`${user.solvedChallenges} challenges solved`}>
                                  {user.solves && Array.isArray(user.solves) ? (
                                    user.solves.map((solve: ScoreboardEntry['solves'][0]) => {
                                      const challenge = challenges?.find((c: Challenge) => c.id === solve.challenge_id);
                                      const challengeName = challenge?.name || `Challenge ${solve.challenge_id}`;
                                      const isFirstBlood = firstBloods.get(solve.challenge_id) === user.account_id;
                                      
                                      return (
                                        <div
                                          key={solve.challenge_id}
                                          title={`${challengeName}${isFirstBlood ? ' (First Blood!)' : ''} - Solved on ${new Date(solve.date).toLocaleString()}`}
                                          className={`cursor-help flex items-center justify-center p-0.5 sm:p-1 rounded transition-colors ${
                                            isFirstBlood 
                                              ? 'hover:bg-red-100 dark:hover:bg-red-900/20' 
                                              : 'hover:bg-green-100 dark:hover:bg-green-900/20'
                                          }`}
                                        >
                                          {isFirstBlood ? (
                                            <Droplets className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                                          ) : (
                                            <Flag className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                                          )}
                                        </div>
                                      );
                                    })
                                  ) : user.solvedChallenges > 0 ? (
                                    Array.from({ length: user.solvedChallenges }, (_, i) => (
                                      <div
                                        key={i}
                                        title="Challenge solved"
                                        className="cursor-help flex items-center justify-center p-0.5 sm:p-1 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors"
                                      >
                                        <Flag className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                                      </div>
                                    ))
                                  ) : (
                                    <span className="text-muted-foreground text-xs sm:text-sm">No solves</span>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8">
                                No scoreboard data available
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      </div>
                    )}
                    
                    {allusers.length > 0 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4 sm:mt-6 px-4 sm:px-0">
                        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                          <span>
                            Showing {startIndex + 1} to {Math.min(endIndex, allusers.length)} of {allusers.length} users
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap">Per page:</span>
                            <Select 
                              value={itemsPerPage.toString()} 
                              onValueChange={(value) => {
                                setItemsPerPage(parseInt(value));
                                setCurrentPage(1); // Reset to first page when changing items per page
                              }}
                            >
                              <SelectTrigger className="w-16 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {allusers.length > itemsPerPage && (
                          <Pagination>
                            <PaginationContent>
                              <PaginationItem>
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
                                <PaginationItem>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              )}
                              
                              <PaginationItem>
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
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="submissions" className="space-y-4">
                <RecentSubmissions />
              </TabsContent>

              <TabsContent value="challenges" className="space-y-4">
                <Card>
                  <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="text-lg sm:text-xl">Challenge Overview</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Available challenges and solve statistics</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-6">
                    {challengesLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                        {[...Array(6)].map((_, i) => (
                          <Skeleton key={i} className="h-32 w-full" />
                        ))}
                      </div>
                    ) : challengesError ? (
                      <div className="text-center text-red-500 py-8 px-4">
                        <Flag className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4" />
                        <p className="text-base sm:text-lg font-semibold mb-2">Failed to load challenges</p>
                        <p className="text-xs sm:text-sm">Please check your API configuration</p>
                      </div>
                    ) : allChallenges.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                          {paginatedChallenges.map((challenge) => {
                            const firstBloodInfo = firstBloodUsers.get(challenge.id);
                            
                            return (
                              <ChallengeCard 
                                key={challenge.id} 
                                challenge={challenge}
                                firstBloodUser={firstBloodInfo}
                              />
                            );
                          })}
                        </div>
                        
                        {allChallenges.length > challengesPerPage && (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-2 sm:px-0">
                            <div className="text-xs sm:text-sm text-muted-foreground">
                              Showing {challengesStartIndex + 1} to {Math.min(challengesEndIndex, allChallenges.length)} of {allChallenges.length} challenges
                            </div>
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
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
                                  <PaginationItem>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                )}
                                
                                <PaginationItem>
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
                      </>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Flag className="h-12 w-12 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Challenges Available</h3>
                        <p>No challenges have been published yet.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
                  <Card>
                    <CardHeader className="px-4 sm:px-6">
                      <CardTitle className="text-base sm:text-lg">Top Performing Users</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Users with highest scores</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6">
                      <div className="space-y-2 sm:space-y-3">
                        {allusers.slice(0, 5).map((user, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                              <span className="font-medium text-xs sm:text-sm truncate">{user.name}</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{user.score} pts</span>
                              <Badge variant="outline" className="text-xs">#{user.rank}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="px-4 sm:px-6">
                      <CardTitle className="text-base sm:text-lg">Challenge Statistics</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Overview of challenges and solving progress</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6">
                      <div className="space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-2 gap-2 sm:gap-4 text-center">
                          <div>
                            <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.totalChallenges}</div>
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Challenges</div>
                          </div>
                          <div>
                            <div className="text-lg sm:text-2xl font-bold text-green-600">
                              {challenges ? Object.keys(challenges.reduce((acc, c) => ({ ...acc, [c.category]: true }), {})).length : 0}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Categories</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:gap-4 text-center">
                          <div>
                            <div className="text-lg sm:text-2xl font-bold text-orange-600">
                              {challenges ? Math.round(challenges.reduce((sum, c) => sum + c.solves, 0) / Math.max(challenges.length, 1)) : 0}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Avg Solves</div>
                          </div>
                          <div>
                            <div className="text-lg sm:text-2xl font-bold text-purple-600">
                              {challenges ? Math.max(...challenges.map(c => c.solves), 0) : 0}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Most Solved</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="px-4 sm:px-6">
                      <CardTitle className="text-base sm:text-lg">Competition Statistics</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Overview of current competition state</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6">
                      <div className="space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-blue-600">{stats.totalusers}</div>
                            <div className="text-sm text-gray-600">Active Users</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-600">{stats.topScore}</div>
                            <div className="text-sm text-gray-600">Highest Score</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-orange-600">{stats.averageScore}</div>
                            <div className="text-sm text-gray-600">Average Score</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-purple-600">{stats.usersWithPoints}</div>
                            <div className="text-sm text-gray-600">Users with Points</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="px-4 sm:px-6">
                      <CardTitle className="text-base sm:text-lg">Challenge Categories</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Distribution of challenges by category</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6">
                      <div className="space-y-2 sm:space-y-3">
                        {challenges && Object.entries(
                          challenges.reduce((acc, challenge) => {
                            acc[challenge.category] = (acc[challenge.category] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([category, count]) => (
                          <div key={category} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                              <span className="font-medium text-xs sm:text-sm truncate">{category}</span>
                            </div>
                            <Badge variant="outline" className="text-xs flex-shrink-0">{count} challenges</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
            
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
          </>
        )}
      </div>
    </div>
  );
}

function ScoreboardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-12 w-full" />
      {[...Array(10)].map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}