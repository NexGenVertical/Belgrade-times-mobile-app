import React from 'react';
import { Button } from './ui/button';
import { 
  Check, 
  X as RejectIcon, 
  Trash2, 
  Flag,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface CommentActionsProps {
  commentId: string;
  isApproved: boolean;
  isSpam: boolean;
  onApprove: (commentId: string) => void;
  onReject: (commentId: string) => void;
  onMarkSpam: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
}

export function CommentActions({
  commentId,
  isApproved,
  isSpam,
  onApprove,
  onReject,
  onMarkSpam,
  onDelete,
  size = 'default',
  variant = 'outline'
}: CommentActionsProps) {
  const handleAction = (action: () => void) => {
    action();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={size}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {!isApproved && !isSpam && (
          <DropdownMenuItem
            onClick={() => handleAction(() => onApprove(commentId))}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            Approve
          </DropdownMenuItem>
        )}
        
        {!isApproved && !isSpam && (
          <DropdownMenuItem
            onClick={() => handleAction(() => onReject(commentId))}
            className="gap-2"
          >
            <RejectIcon className="h-4 w-4" />
            Reject
          </DropdownMenuItem>
        )}

        {!isSpam && (
          <DropdownMenuItem
            onClick={() => handleAction(() => onMarkSpam(commentId))}
            className="gap-2"
          >
            <Flag className="h-4 w-4" />
            Mark as Spam
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => handleAction(() => onDelete(commentId))}
          className="gap-2 text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}