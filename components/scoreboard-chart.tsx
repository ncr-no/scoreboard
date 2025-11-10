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
	const liveSubmissions = useLiveSubmissions();
	const { config } = useConfig();
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 8;

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

	const getCategoryColor = (category: string) => {
		const colors = {
			'Home Task': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
			'Lab Task': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
			'Crypto': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
			'Web': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
			'Reversing': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
			'Forensics': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
			'OSINT': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
			'Misc': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
		};
		return colors[category as keyof typeof colors] || colors['Misc'];
	};

	if (isLoading) {
		return (
			<Card className="h-full flex flex-col">
				<CardHeader className="pb-2 px-4 py-2">
					<div className="flex justify-between items-center">
						<div>
							<CardTitle className="flex items-center gap-1 text-base">
								<Clock className="h-4 w-4" />
								Recent Submissions
							</CardTitle>
							<CardDescription className="flex items-center gap-1 text-xs">
								<Wifi className="h-3 w-3 text-green-500 animate-pulse" /> 
								Live updates every {Math.round(config.refetchInterval/1000)}s
							</CardDescription>
						</div>
						<Button 
							variant="outline" 
							size="sm" 
							onClick={handleRefresh}
							disabled={true}
							className="h-8 w-8 p-0"
						>
							<RefreshCw className="h-4 w-4" />
							<span className="sr-only">Refresh</span>
						</Button>
					</div>
				</CardHeader>
				<CardContent className="flex-1 p-0 sm:px-6 ">
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
		<Card className="h-full flex flex-col">
			<CardHeader className="pb-2 px-4 py-2">
				<div className="flex justify-between items-center">
					<div>
						<CardTitle className="flex items-center gap-2 text-base">
							<Clock className="h-4 w-4" />
							Recent Submissions
						</CardTitle>
						<CardDescription className="flex items-center gap-1 text-xs">
							<Wifi className="h-3 w-3 text-green-500 animate-pulse" /> 
							Live updates every {Math.round(config.refetchInterval/1000)}s
						</CardDescription>
					</div>
					<Button 
						variant="outline" 
						size="sm" 
						onClick={handleRefresh}
						disabled={isLoading || isRefreshing}
						className="h-7 w-7 p-0"
					>
						<RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
						<span className="sr-only">Refresh</span>
					</Button>
				</div>
			</CardHeader>
			<CardContent className="flex-1 flex flex-col p-0 px-4 overflow-hidden">
				{filteredSubmissions.length > 0 ? (
					<>
						<div className="space-y-1.5 flex-1 overflow-y-auto">
							{paginatedSubmissions.map((submission) => (
								<div
									key={submission.id}
									className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-xs"
								>
									<div className="flex items-center gap-2 min-w-0 flex-1">
										<div className="flex-shrink-0">
											<CheckCircle className="h-3 w-3 text-green-500" />
										</div>
										<div className="flex items-center gap-1 min-w-0">
											<User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
											<span className="font-medium truncate text-xs">{submission.user.name}</span>
										</div>
										<div className="flex items-center gap-1 min-w-0">
											<Flag className="h-3 w-3 text-muted-foreground flex-shrink-0" />
											<span className="truncate text-xs">{submission.challenge.name}</span>
										</div>
										<Badge className={`${getCategoryColor(submission.challenge.category)} text-[10px] px-1.5 py-0 flex-shrink-0 hidden sm:inline-flex`}>
											{submission.challenge.category}
										</Badge>
									</div>
									<div className="flex items-center gap-2 flex-shrink-0">
										<span className="font-mono text-xs font-semibold text-green-600">
											+{submission.challenge.value}
										</span>
										<span className="text-[10px] text-muted-foreground hidden sm:inline" title={new Date(submission.date).toLocaleString()}>
											{formatTimeAgo(submission.date)}
										</span>
									</div>
								</div>
							))}
						</div>
						
						{/* Pagination */}
						{totalPages > 1 && (
							<div className="flex items-center justify-between py-2 pb-[0.8rem] border-t mt-auto flex-shrink-0">
								<div className="text-xs text-muted-foreground">
									{startIndex + 1}-{Math.min(endIndex, filteredSubmissions.length)} of {filteredSubmissions.length}
								</div>
								<div className="flex items-center gap-1">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
										disabled={currentPage === 1}
										className="h-7 w-7 p-0"
									>
										<ChevronLeft className="h-3 w-3" />
									</Button>
									<div className="text-xs">
										{currentPage} / {totalPages}
									</div>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
										disabled={currentPage === totalPages}
										className="h-7 w-7 p-0"
									>
										<ChevronRight className="h-3 w-3" />
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
		<div className="space-y-1.5">
			{[...Array(10)].map((_, i) => (
				<div key={i} className="flex items-center justify-between p-2 rounded-lg border">
					<div className="flex items-center gap-2 flex-1">
						<Skeleton className="h-3 w-3 rounded-full" />
						<Skeleton className="h-3 w-16" />
						<Skeleton className="h-3 w-24" />
						<Skeleton className="h-4 w-12 rounded-full hidden sm:block" />
					</div>
					<div className="flex items-center gap-2">
						<Skeleton className="h-3 w-8" />
						<Skeleton className="h-3 w-10 hidden sm:block" />
					</div>
				</div>
			))}
		</div>
	);
}
