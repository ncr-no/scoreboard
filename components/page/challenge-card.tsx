'use client';

import { Challenge } from '@/types/ctfd';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ChallengeDetailView } from './challenge-detail-view';
import { CheckCircle, Users, Droplets } from 'lucide-react';

interface ChallengeCardProps {
  challenge: Challenge;
  firstBloodUser?: {
    id: number;
    name: string;
  };
}

export function ChallengeCard({ challenge, firstBloodUser }: ChallengeCardProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
          <CardHeader className="py-1 px-2 sm:px-2.5">
            <div className="flex items-start justify-between gap-1.5">
              <div className="flex-1 min-w-0">
                <CardTitle className="flex items-center gap-1 text-xs sm:text-sm">
                  <span className="truncate">{challenge.name}</span>
                  {challenge.solved_by_me && (
                    <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-500 flex-shrink-0" />
                  )}
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-xs truncate mt-0.5">{challenge.category}</CardDescription>
                
                {firstBloodUser && (
                  <div className="mt-1 flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground">
                    <Droplets className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-500 flex-shrink-0" />
                    <span className="truncate">First Blood: <span className="font-medium text-red-500">{firstBloodUser.name}</span></span>
                  </div>
                )}
              </div>
              {challenge.solved_by_me && (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-[9px] sm:text-[10px] h-4 sm:h-4.5 flex-shrink-0">
                  Solved
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardFooter className="flex items-center justify-between px-2 sm:px-2.5 py-1">
            <div className="flex items-center gap-1">
              {challenge.value > 0 ? (
                <p className="text-xs sm:text-sm font-bold text-primary">{challenge.value} pts</p>
              ) : (
                <Badge variant="secondary" className="text-[9px] sm:text-[10px] h-4">Practice</Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
              <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
              <span>{challenge.solves || 0} solved</span>
            </div>
          </CardFooter>
        </Card>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{challenge.name}</DialogTitle>
        </DialogHeader>
        <ChallengeDetailView challengeId={challenge.id} />
      </DialogContent>
    </Dialog>
  );
}