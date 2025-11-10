// /src/components/page/challenge-detail-view.tsx
'use client';

import { useChallengeById } from '@/hooks/api/useChallengeById';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Users, Trophy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getCategoryColor } from '@/lib/utils';

export function ChallengeDetailView({ challengeId }: { challengeId: number }) {
  const { data: challenge, isLoading, isError } = useChallengeById(challengeId);

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (isError ||!challenge) return <p className="text-red-500">Could not load challenge details.</p>;

  return (
    <div className="space-y-4">
      {/* Challenge Statistics */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">
            {challenge.value} points
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-500" />
          <span className="text-sm">{challenge.solves || 0} users solved</span>
        </div>
        {challenge.solved_by_me && (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Solved
          </Badge>
        )}
        <Badge className={getCategoryColor(challenge.category)}>
          {challenge.category}
        </Badge>
      </div>
      
      {/* Challenge Description */}
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown
          components={{
            // Customize code blocks
            code: ({ className, children, ...props }: any) => {
              const match = /language-(\w+)/.exec(className || '');
              const isBlock = match;
              return isBlock ? (
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              ) : (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm" {...props}>
                  {children}
                </code>
              );
            },
            // Customize links
            a: ({ ...props }: any) => (
              <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
            ),
            // Customize headings
            h1: ({ ...props }: any) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
            h2: ({ ...props }: any) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
            h3: ({ ...props }: any) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
            // Customize lists
            ul: ({ ...props }: any) => <ul className="list-disc list-inside my-2 space-y-1" {...props} />,
            ol: ({ ...props }: any) => <ol className="list-decimal list-inside my-2 space-y-1" {...props} />,
            // Customize blockquotes
            blockquote: ({ ...props }: any) => (
              <blockquote className="border-l-4 border-muted-foreground pl-4 italic my-4" {...props} />
            ),
            // Customize paragraphs
            p: ({ ...props }: any) => <p className="my-2" {...props} />,
            // Customize tables
            table: ({ ...props }: any) => (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse border border-border" {...props} />
              </div>
            ),
            th: ({ ...props }: any) => (
              <th className="border border-border px-4 py-2 bg-muted font-semibold text-left" {...props} />
            ),
            td: ({ ...props }: any) => (
              <td className="border border-border px-4 py-2" {...props} />
            ),
          }}
        >
          {challenge.description || ''}
        </ReactMarkdown>
      </div>
      {/* Additional details like files, hints, etc. can be rendered here */}
    </div>
  );
}