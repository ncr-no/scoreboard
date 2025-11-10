// Moved RecentSubmissions from components/page/recent-submissions.tsx
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, User, Flag, RefreshCw, Wifi, ChevronLeft, ChevronRight } from "lucide-react";
import type { Submission } from '@/types/ctfd';
import { useState } from "react";
import { useLiveSubmissions } from '@/hooks/api/useLiveSubmissions';
import { useConfig } from '@/contexts/config-context';
import { getCategoryColor } from '@/lib/utils';

interface RecentSubmissionsProps {
	submissions?: Submission[];
	isLoading?: boolean;
	isError?: boolean;
	error?: Error | null;
	onRefresh?: () => void;
	useExternalData?: boolean;
}

export function RecentSubmissions({ 
	submissions: externalSubmissions, 
	isLoading: externalIsLoading, 
	isError: externalIsError, 
	error: externalError, 
	onRefresh: externalOnRefresh,
	useExternalData = false
}: RecentSubmissionsProps) {
	const { config } = useConfig();
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 8;

	// Only enable live submissions hook when not using external data
	const liveSubmissions = useLiveSubmissions(!useExternalData);

	const submissions = useExternalData ? externalSubmissions || [] : liveSubmissions.submissions;
	const isLoading = useExternalData ? externalIsLoading || false : liveSubmissions.isLoading;
	const isError = useExternalData ? externalIsError || false : liveSubmissions.isError;
	const error = useExternalData ? externalError : liveSubmissions.error;

	// Filter and sort submissions
	const filteredSubmissions = [...submissions]
		.filter((submission) => 
			submission.challenge && 
			submission.challenge.id && 
			submission.challenge.name &&
			submission.challenge.name !== 'challenge_null'
		)
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedSubmissions = filteredSubmissions.slice(startIndex, endIndex);

	const formatTimeAgo = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);
		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		return `${diffDays}d ago`;
	};

	const handleRefresh = () => {
		setIsRefreshing(true);
		if (useExternalData && externalOnRefresh) {
			externalOnRefresh();
		} else {
			liveSubmissions.refresh();
		}
		setTimeout(() => setIsRefreshing(false), 1000);
	};


	if (isLoading) {
		return (
			<Card className="h-full flex flex-col">
				<CardHeader className="pb-2 px-4 lg:px-6 2xl:px-8 py-2 lg:py-3 2xl:py-4">
					<div className="flex justify-between items-center">
						<div>
							<CardTitle className="flex items-center gap-1 lg:gap-2 text-sm sm:text-base lg:text-lg 2xl:text-xl">
								<Clock className="h-4 w-4 lg:h-5 lg:w-5 2xl:h-6 2xl:w-6" />
								Recent Submissions
							</CardTitle>
							<CardDescription className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm 2xl:text-base">
								<Wifi className="h-3 w-3 lg:h-4 lg:w-4 text-green-500 animate-pulse" /> 
								Live updates every {Math.round(config.refetchInterval/1000)}s
							</CardDescription>
						</div>
						<Button 
							variant="outline" 
							size="sm" 
							onClick={handleRefresh}
							disabled={true}
							className="h-8 w-8 lg:h-10 lg:w-10 2xl:h-12 2xl:w-12 p-0"
						>
							<RefreshCw className="h-4 w-4 lg:h-5 lg:w-5 2xl:h-6 2xl:w-6" />
							<span className="sr-only">Refresh</span>
						</Button>
					</div>
				</CardHeader>
				<CardContent className="flex-1 p-0 sm:px-4 lg:px-6 2xl:px-8">
					<SubmissionsSkeleton />
				</CardContent>
			</Card>
		);
	}

	if (isError) {
		return (
			<Card className="h-full flex flex-col">
				<CardHeader className="pb-3">
					<div className="flex justify-between items-center">
						<div>
							<CardTitle className="flex items-center gap-2">
								<Clock className="h-5 w-5" />
								Recent Submissions
							</CardTitle>
							<CardDescription className="flex items-center gap-1">
								<Wifi className="h-3 w-3 text-green-500 animate-pulse" /> 
								Live updates every {Math.round(config.refetchInterval/1000)}s
							</CardDescription>
						</div>
						<Button 
							variant="outline" 
							size="sm" 
							onClick={handleRefresh}
							disabled={isLoading}
							className="h-8 w-8 p-0"
						>
							<RefreshCw className="h-4 w-4" />
							<span className="sr-only">Refresh</span>
						</Button>
					</div>
				</CardHeader>
				<CardContent className="flex-1 flex items-center justify-center px-4">
					<div className="text-center text-red-500 py-8">
						<XCircle className="h-12 w-12 mx-auto mb-4" />
						<p className="text-lg font-semibold mb-2">Failed to load submissions</p>
						<p className="text-sm">{error?.message}</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="h-full flex flex-col min-h-0">
			<CardHeader className="pb-1 sm:pb-1.5 px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 flex-shrink-0">
				<div className="flex justify-between items-center gap-2">
					<div className="min-w-0 flex-1">
						<CardTitle className="flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm md:text-base">
							<Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 flex-shrink-0" />
							<span className="truncate">Recent Submissions</span>
						</CardTitle>
						<CardDescription className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] md:text-xs">
							<Wifi className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 text-green-500 animate-pulse flex-shrink-0" /> 
							<span className="truncate">Live updates every {Math.round(config.refetchInterval/1000)}s</span>
						</CardDescription>
					</div>
					<Button 
						variant="outline" 
						size="sm" 
						onClick={handleRefresh}
						disabled={isLoading || isRefreshing}
						className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 p-0 flex-shrink-0"
					>
						<RefreshCw className={`h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
						<span className="sr-only">Refresh</span>
					</Button>
				</div>
			</CardHeader>
			<CardContent className="flex-1 flex flex-col p-0 px-1.5 sm:px-2 md:px-3 overflow-hidden min-h-0">
				{filteredSubmissions.length > 0 ? (
					<>
						<div className="space-y-0.5 sm:space-y-1 flex-1 overflow-y-auto min-h-0">
							{paginatedSubmissions.map((submission) => (
								<div
									key={submission.id}
									className="flex items-center justify-between p-1 sm:p-1.5 md:p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-[10px] sm:text-xs md:text-sm"
								>
									<div className="flex items-center gap-0.5 sm:gap-1 md:gap-1.5 min-w-0 flex-1">
										<div className="flex-shrink-0">
											<CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 text-green-500" />
										</div>
										<div className="flex items-center gap-0.5 sm:gap-0.5 md:gap-1 min-w-0">
											<User className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 text-muted-foreground flex-shrink-0" />
											<span className="font-medium truncate text-[10px] sm:text-xs md:text-sm">{submission.user.name}</span>
										</div>
										<div className="flex items-center gap-0.5 sm:gap-0.5 md:gap-1 min-w-0 hidden sm:flex">
											<Flag className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 text-muted-foreground flex-shrink-0" />
											<span className="truncate text-[10px] sm:text-xs md:text-sm">{submission.challenge.name}</span>
										</div>
										<Badge className={`${getCategoryColor(submission.challenge.category)} text-[9px] sm:text-[10px] md:text-xs px-1 sm:px-1.5 py-0.5 flex-shrink-0 hidden md:inline-flex`}>
											{submission.challenge.category}
										</Badge>
									</div>
									<div className="flex items-center gap-0.5 sm:gap-1 md:gap-1.5 flex-shrink-0">
										<span className="font-mono text-[10px] sm:text-xs md:text-sm font-semibold text-green-600">
											+{submission.challenge.value}
										</span>
										<span className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground hidden sm:inline" title={new Date(submission.date).toLocaleString()}>
											{formatTimeAgo(submission.date)}
										</span>
									</div>
								</div>
							))}
						</div>
						
						{/* Pagination */}
						{totalPages > 1 && (
							<div className="flex items-center justify-between pt-1 pb-0 border-t mt-auto flex-shrink-0 gap-1 sm:gap-1.5">
								<div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground truncate">
									{startIndex + 1}-{Math.min(endIndex, filteredSubmissions.length)} of {filteredSubmissions.length}
								</div>
								<div className="flex items-center gap-0.5">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
										disabled={currentPage === 1}
										className="h-5 w-5 sm:h-6 sm:w-6 p-0"
									>
										<ChevronLeft className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
									</Button>
									<div className="text-[9px] sm:text-[10px] md:text-xs">
										{currentPage} / {totalPages}
									</div>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
										disabled={currentPage === totalPages}
										className="h-5 w-5 sm:h-6 sm:w-6 p-0"
									>
										<ChevronRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
									</Button>
								</div>
							</div>
						)}
					</>
				) : (
					<div className="text-center py-8 text-muted-foreground flex-1 flex flex-col items-center justify-center px-4">
						<Clock className="h-8 w-8 mx-auto mb-3" />
						<h3 className="text-sm font-semibold mb-1">No Recent Submissions</h3>
						<p className="text-xs">Submissions will appear here as users solve challenges.</p>
						<p className="text-xs mt-1.5">
							<Wifi className="h-3 w-3 inline-block mr-1 text-green-500 animate-pulse" />
							Auto-refreshing every {Math.round(config.refetchInterval/1000)}s
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function SubmissionsSkeleton() {
	return (
		<div className="space-y-0.5 sm:space-y-1">
			{[...Array(8)].map((_, i) => (
				<div key={i} className="flex items-center justify-between p-1 sm:p-1.5 md:p-2 rounded-lg border">
					<div className="flex items-center gap-0.5 sm:gap-1 flex-1">
						<Skeleton className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full" />
						<Skeleton className="h-2.5 sm:h-3 w-12 sm:w-16" />
						<Skeleton className="h-2.5 sm:h-3 w-16 sm:w-24 hidden sm:block" />
						<Skeleton className="h-3 w-10 rounded-full hidden md:block" />
					</div>
					<div className="flex items-center gap-0.5 sm:gap-1">
						<Skeleton className="h-2.5 sm:h-3 w-6 sm:w-8" />
						<Skeleton className="h-2.5 sm:h-3 w-8 sm:w-10 hidden sm:block" />
					</div>
				</div>
			))}
		</div>
	);
}
