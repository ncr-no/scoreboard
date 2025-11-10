'use client';

import { AlertCircle, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AuthWarningBannerProps {
  isVisible: boolean;
  onOpenSettings: () => void;
}

export function AuthWarningBanner({ isVisible, onOpenSettings }: AuthWarningBannerProps) {
  if (!isVisible) return null;

  return (
    <Card className="border-amber-500 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/20 mb-6">
      <CardContent className="py-4">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100">
              Authentication Required
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Your CTFd instance requires authentication to access the scoreboard data. 
              Please configure your API token to continue.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button 
                onClick={onOpenSettings}
                variant="default"
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure API Token
              </Button>
            </div>
            <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded-md border border-amber-200 dark:border-amber-800">
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-100 mb-2">
                How to get your API token:
              </p>
              <ol className="text-xs text-amber-800 dark:text-amber-200 space-y-1 list-decimal list-inside">
                <li>Log into your CTFd instance as an admin</li>
                <li>Go to <span className="font-mono bg-amber-100 dark:bg-amber-900/50 px-1 rounded">Admin Panel</span> → <span className="font-mono bg-amber-100 dark:bg-amber-900/50 px-1 rounded">Settings</span> → <span className="font-mono bg-amber-100 dark:bg-amber-900/50 px-1 rounded">Security</span></li>
                <li>Generate or copy an existing API token</li>
                <li>Paste it into the configuration dialog</li>
              </ol>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
