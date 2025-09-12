'use client';

import { useState, useEffect } from 'react';
import { Mail, X, MoreHorizontal, XCircle, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { LoadingButton } from '@/components/ui/loading-button';

interface FloatingInvitationToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkResend: () => void;
  onBulkCancel: () => void;
  onBulkDelete: () => void;
  isUpdating?: boolean;
}

export function FloatingInvitationToolbar({
  selectedCount,
  onClearSelection,
  onBulkResend,
  onBulkCancel,
  onBulkDelete,
  isUpdating = false
}: FloatingInvitationToolbarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(selectedCount > 0);
  }, [selectedCount]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg shadow-lg px-4 py-3 min-w-[400px] max-w-[600px]">
        {/* Selection Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {selectedCount} invitation{selectedCount !== 1 ? 's' : ''} selected
            </p>
            <p className="text-xs text-gray-500">Choose a bulk action</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Quick Actions */}
          <Button
            onClick={onBulkResend}
            variant="outline"
            size="sm"
            disabled={isUpdating}
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Resend
          </Button>

          <Button
            onClick={onBulkCancel}
            variant="outline"
            size="sm"
            disabled={isUpdating}
            className="flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Cancel
          </Button>

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={isUpdating}
                className="flex items-center gap-2"
              >
                <MoreHorizontal className="h-4 w-4" />
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={onBulkDelete}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Selection */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isUpdating}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Loading Indicator */}
        {isUpdating && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            Updating...
          </div>
        )}
      </div>
    </div>
  );
}
