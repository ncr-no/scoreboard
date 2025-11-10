'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ConfigState {
  apiUrl: string;
  apiToken: string;
  refetchInterval: number; // in milliseconds
  topTeamsCount: number; // number of top teams to fetch (minimum 10)
}

interface ConfigContextType {
  config: ConfigState;
  setConfig: (config: ConfigState) => void;
  isConfigured: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const CONFIG_STORAGE_KEY = 'ctfd-config';

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<ConfigState>({
    apiUrl: '',
    apiToken: '',
    refetchInterval: 60000, // Default to 60 seconds
    topTeamsCount: 10, // Default to 10 teams
  });

  const [isConfigured, setIsConfigured] = useState(false);

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        // Ensure refetchInterval exists for backward compatibility
        const configWithDefaults = {
          apiUrl: parsed.apiUrl || '',
          apiToken: parsed.apiToken || '',
          refetchInterval: parsed.refetchInterval || 30000,
          topTeamsCount: parsed.topTeamsCount || 10,
        };
        setConfigState(configWithDefaults);
        setIsConfigured(!!configWithDefaults.apiUrl && !!configWithDefaults.apiToken);
      } catch (error) {
        console.error('Failed to parse saved config:', error);
      }
    }
  }, []);

  const setConfig = (newConfig: ConfigState) => {
    setConfigState(newConfig);
    setIsConfigured(!!newConfig.apiUrl && !!newConfig.apiToken);
    
    // Save to localStorage
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
  };

  return (
    <ConfigContext.Provider value={{ config, setConfig, isConfigured }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
