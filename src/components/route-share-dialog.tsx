'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink, Share2, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { SmartRouteSuggestionOutput } from '@/lib/smart-route-suggestion';

type SuggestedRoute = NonNullable<SmartRouteSuggestionOutput['routes']>[0];

interface RouteShareDialogProps {
  route: SuggestedRoute;
  shareUrl: string;
  triggerClassName?: string;
  triggerSize?: 'icon' | 'sm';
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export function RouteShareDialog({ route, shareUrl, triggerClassName, triggerSize = 'icon' }: RouteShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  const title = route.segments.map(segment => segment.busNumber).join(' → ');
  const originStop = route.segments[0]?.startStop ?? 'Unknown stop';
  const destinationStop = route.segments[route.segments.length - 1]?.endStop ?? 'Unknown stop';
  const shareText = `${title}\n${originStop} → ${destinationStop}\n${shareUrl}`;
  const canShareNatively = typeof navigator !== 'undefined' && 'share' in navigator;

  const handleCopy = async () => {
    try {
      await copyTextToClipboard(shareUrl);
      setIsCopied(true);
      toast({
        title: 'Link copied',
        description: 'Route link copied to clipboard.',
      });
      window.setTimeout(() => setIsCopied(false), 1800);
    } catch (error) {
      console.error('Failed to copy route link', error);
      toast({
        title: 'Copy failed',
        description: 'Could not copy the route link.',
        variant: 'destructive',
      });
    }
  };

  const handleNativeShare = async () => {
    if (!canShareNatively) {
      await handleCopy();
      return;
    }

    try {
      setIsSharing(true);
      await navigator.share({
        title: `Mangalore route: ${title}`,
        text: shareText,
        url: shareUrl,
      });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('Failed to share route', error);
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size={triggerSize}
          onClick={(e) => e.stopPropagation()}
          className={triggerClassName}
          title="Share route"
        >
          <Share2 className={triggerSize === 'icon' ? 'h-3.5 w-3.5 text-primary' : 'h-4 w-4 text-primary'} />
          {triggerSize === 'sm' && <span className="ml-1">Share</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-sm sm:max-w-md rounded-2xl p-5 sm:p-6">
        <DialogHeader className="text-left">
          <DialogTitle>Share route</DialogTitle>
          <DialogDescription>
            Send this route to someone, copy the link, or scan the QR code.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-xl border border-border/70 bg-secondary/40 p-3">
            <p className="text-sm font-semibold text-foreground truncate">{title}</p>
            <p className="text-xs text-muted-foreground mt-1">{originStop} → {destinationStop}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleNativeShare} disabled={isSharing} className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" />
              {canShareNatively ? 'Share' : 'Copy link'}
            </Button>
            <Button variant="outline" onClick={handleCopy} className="w-full">
              {isCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {isCopied ? 'Copied' : 'Copy link'}
            </Button>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-white p-4">
            <div className="rounded-xl bg-white p-1">
              <QRCodeSVG value={shareUrl} size={180} bgColor="#ffffff" fgColor="#111827" includeMargin />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <QrCode className="h-3.5 w-3.5" />
              Scan to open this route
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 px-3 py-2">
            <p className="break-all text-[11px] text-muted-foreground">{shareUrl}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
