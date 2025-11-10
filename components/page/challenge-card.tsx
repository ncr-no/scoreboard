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
          <CardHeader className="py-1 px-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-sm">
                  {challenge.name}
                  {challenge.solved_by_me && (
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  )}
                </CardTitle>
                <CardDescription className="text-xs">{challenge.category}</CardDescription>
                
                {firstBloodUser && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Droplets className="h-3 w-3 text-red-500" />
                    <span>First Blood: <span className="font-medium text-red-500">{firstBloodUser.name}</span></span>
                  </div>
                )}
              </div>
              {challenge.solved_by_me && (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-[10px] h-5">
                  Solved
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardFooter className="flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              {challenge.value > 0 ? (
                <p className="text-base font-bold text-primary">{challenge.value} pts</p>
              ) : (
                <Badge variant="secondary" className="text-[10px]">Practice</Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{challenge.solves || 0} solved</span>
            </div>
          </CardFooter>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{challenge.name}</DialogTitle>
        </DialogHeader>
        <ChallengeDetailView challengeId={challenge.id} />
      </DialogContent>
    </Dialog>
  );
}