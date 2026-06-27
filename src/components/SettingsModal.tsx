'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Settings } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuItem } from './ui/sidebar';

export function SettingsModal() {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('gemini');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const savedProvider = window.localStorage.getItem('ai_provider');
    const savedApiKey = window.localStorage.getItem('ai_api_key');

    if (savedProvider) {
      setProvider(savedProvider);
    } else {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'ai_provider' && value) setProvider(value);
      }
    }

    if (savedApiKey) {
      setApiKey(savedApiKey);
    } else {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'ai_api_key' && value) setApiKey(decodeURIComponent(value));
      }
    }
  }, [open]);

  const saveSettings = () => {
    const expires = new Date();
    expires.setTime(expires.getTime() + 365 * 24 * 60 * 60 * 1000);
    window.localStorage.setItem('ai_provider', provider);
    window.localStorage.setItem('ai_api_key', apiKey);
    document.cookie = `ai_provider=${provider};expires=${expires.toUTCString()};path=/`;
    document.cookie = `ai_api_key=${encodeURIComponent(apiKey)};expires=${expires.toUTCString()};path=/`;
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <SidebarMenuButton>
          <Settings className="h-5 w-5" />
          <span>AI Settings</span>
        </SidebarMenuButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>AI Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Gemini</SelectItem>
                <SelectItem value="groq">Groq</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>API Key</Label>
            <Input 
              type="password" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)} 
              placeholder={`Enter your ${provider === 'gemini' ? 'Gemini' : 'Groq'} API key`}
            />
          </div>
          <Button onClick={saveSettings}>Save Settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
