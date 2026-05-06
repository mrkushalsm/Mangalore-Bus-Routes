'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink, QrCode, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMapProvider } from '@/hooks/use-map-provider';
import { buildTransitVizUrl, buildGoogleMapsUrl } from '@/lib/utils';
import type { BusRoute } from '@/lib/bus-data';

interface BusRouteShareDialogProps {
  route: BusRoute;
  triggerClassName?: string;
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

export function BusRouteShareDialog({ route, triggerClassName }: BusRouteShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();
  const { provider } = useMapProvider();

  const title = `${route.busNumber} - ${route.description}`;
  const originStop = route.stops[0] ?? 'Unknown stop';
  const destinationStop = route.stops[route.stops.length - 1] ?? 'Unknown stop';
  
  const transitVizUrl = buildTransitVizUrl(originStop, destinationStop, 0);
  const googleMapsUrl = buildGoogleMapsUrl(originStop, destinationStop, route.stops);
  const mapUrl = provider === 'transit-viz' ? transitVizUrl : googleMapsUrl;
  
  const shareText = [
    `Bus Route: ${route.busNumber}`,
    `Description: ${route.description}`,
    `Stops: ${route.stops.join(' → ')}`,
    `Map: ${mapUrl}`,
  ].join('\n');
  const canShareNatively = typeof navigator !== 'undefined' && 'share' in navigator;

  const handleCopy = async () => {
    try {
      await copyTextToClipboard(shareText);
      setIsCopied(true);
      toast({
        title: 'Route copied',
        description: 'Route details copied to clipboard.',
      });
      window.setTimeout(() => setIsCopied(false), 1800);
    } catch (error) {
      console.error('Failed to copy bus route', error);
      toast({
        title: 'Copy failed',
        description: 'Could not copy route details.',
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
        title: `Mangalore Bus Route: ${route.busNumber}`,
        text: shareText,
      });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('Failed to share bus route', error);
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => e.stopPropagation()}
          className={triggerClassName}
          title="Share route"
        >
          <Share2 className="h-4 w-4" />
          Share Route
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-sm sm:max-w-md rounded-2xl p-5 sm:p-6">
        <DialogHeader className="text-left">
          <DialogTitle>Share route</DialogTitle>
          <DialogDescription>
            Share this bus route as text or scan the QR code to view its details.
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
              {canShareNatively ? 'Share' : 'Copy text'}
            </Button>
            <Button variant="outline" onClick={handleCopy} className="w-full">
              {isCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {isCopied ? 'Copied' : 'Copy text'}
            </Button>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-white p-4">
            <div className="rounded-xl bg-white p-1">
              <QRCodeSVG value={shareText} size={180} bgColor="#ffffff" fgColor="#111827" includeMargin />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <QrCode className="h-3.5 w-3.5" />
              Scan to read route details
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 px-3 py-2">
            <p className="break-all text-[11px] text-muted-foreground whitespace-pre-wrap">{shareText}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}