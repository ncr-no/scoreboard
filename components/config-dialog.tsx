'use client';

import { useState } from 'react';
import { useConfig } from '@/contexts/config-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';

export function ConfigDialog() {
  const { config, setConfig } = useConfig();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    apiUrl: config.apiUrl,
    apiToken: config.apiToken,
    refetchInterval: config.refetchInterval / 1000, // Store in seconds for UI
    topTeamsCount: config.topTeamsCount,
    autoRotate: config.autoRotate,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!formData.apiUrl.trim() || !formData.apiToken.trim()) {
      alert('Please fill in both API URL and Token');
      return;
    }

    // Validate refetch interval
    const interval = Number(formData.refetchInterval);
    if (isNaN(interval) || interval < 5 || interval > 300) {
      alert('Refetch interval must be between 5 and 300 seconds');
      return;
    }

    // Validate top teams count
    const topTeams = Number(formData.topTeamsCount);
    if (isNaN(topTeams) || topTeams < 10 || topTeams > 100) {
      alert('Top teams count must be between 10 and 100');
      return;
    }

    // Remove trailing slash from URL if present
    const cleanUrl = formData.apiUrl.replace(/\/$/, '');
    
    setConfig({
      apiUrl: cleanUrl,
      apiToken: formData.apiToken.trim(),
      refetchInterval: interval * 1000, // Convert to milliseconds
      topTeamsCount: topTeams,
      autoRotate: formData.autoRotate,
    });
    
    setOpen(false);
  };

  const handleInputChange = (field: 'apiUrl' | 'apiToken' | 'refetchInterval' | 'topTeamsCount') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleCheckboxChange = (field: 'autoRotate') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.checked,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      // Reset form data to current config when dialog opens
      if (newOpen) {
        setFormData({
          apiUrl: config.apiUrl,
          apiToken: config.apiToken,
          refetchInterval: config.refetchInterval / 1000,
          topTeamsCount: config.topTeamsCount,
          autoRotate: config.autoRotate,
        });
      }
    }}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="shadow-md"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>CTFd Configuration</DialogTitle>
          <DialogDescription>
            Configure your CTFd instance API URL and token to connect to the scoreboard.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiUrl">API URL</Label>
            <Input
              id="apiUrl"
              type="url"
              placeholder="https://your-ctfd-instance.com"
              value={formData.apiUrl}
              onChange={handleInputChange('apiUrl')}
              required
            />
            <p className="text-xs text-muted-foreground">
              The base URL of your CTFd instance (without /api/v1)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiToken">API Token</Label>
            <Input
              id="apiToken"
              type="password"
              placeholder="Your CTFd API token"
              value={formData.apiToken}
              onChange={handleInputChange('apiToken')}
              required
            />
            <p className="text-xs text-muted-foreground">
              You can find this in your CTFd admin panel under Settings → Security
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="refetchInterval">Auto-refresh Interval (seconds)</Label>
            <Input
              id="refetchInterval"
              type="number"
              min="5"
              max="300"
              placeholder="30"
              value={formData.refetchInterval}
              onChange={handleInputChange('refetchInterval')}
              required
            />
            <p className="text-xs text-muted-foreground">
              How often to refresh data automatically (5-300 seconds)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="topTeamsCount">Top Teams Count</Label>
            <Input
              id="topTeamsCount"
              type="number"
              min="10"
              max="100"
              placeholder="10"
              value={formData.topTeamsCount}
              onChange={handleInputChange('topTeamsCount')}
              required
            />
            <p className="text-xs text-muted-foreground">
              Number of top teams to display (10-100)
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">
              ⚠️ Warning: Increasing this value can lead to API rate limiting, which may break most of the functionality.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                id="autoRotate"
                type="checkbox"
                checked={formData.autoRotate}
                onChange={handleCheckboxChange('autoRotate')}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="autoRotate" className="text-sm font-normal cursor-pointer">
                Auto-rotate tabs
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Automatically rotate between Scoreboard, Challenges, and Analytics tabs every 10 seconds
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Configuration
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
