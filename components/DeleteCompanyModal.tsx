'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  slug: string;
}

interface DeleteCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  onConfirmDelete: (companyId: string, reason: string) => Promise<void>;
}

export function DeleteCompanyModal({ isOpen, onClose, company, onConfirmDelete }: DeleteCompanyModalProps) {
  const [confirmationStep, setConfirmationStep] = useState<'initial' | 'name-confirmation'>('initial');
  const [confirmationText, setConfirmationText] = useState('');
  const [deletionReason, setDeletionReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!company) return;
    
    if (confirmationText !== company.name) {
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirmDelete(company.id, deletionReason);
      // Reset form and close modal on success
      setConfirmationText('');
      setDeletionReason('');
      setConfirmationStep('initial');
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Error in delete confirmation:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setConfirmationText('');
    setDeletionReason('');
    setConfirmationStep('initial');
    onClose();
  };

  const handleYesClick = () => {
    setConfirmationStep('name-confirmation');
  };

  const handleNoClick = () => {
    onClose();
  };

  const isConfirmationValid = company && confirmationText === company.name;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Company
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the company and remove all associated data.
          </DialogDescription>
        </DialogHeader>
        
        {confirmationStep === 'initial' ? (
          // Step 1: Initial Yes/No confirmation
          <div className="space-y-4">
            {/* Warning Box */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-2">This will permanently delete:</p>
                  <ul className="space-y-1">
                    <li>• Company profile and settings</li>
                    <li>• All company data and configurations</li>
                    <li>• Associated user relationships</li>
                  </ul>
                  <p className="font-medium mt-2 text-red-700">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {/* Company Info */}
            {company && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{company.name}</p>
                    <p className="text-sm text-gray-600">{company.slug}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Question */}
            <div className="text-center py-4">
              <p className="text-lg font-medium text-white mb-4">
                Are you sure you want to delete this company?
              </p>
            </div>
          </div>
        ) : (
          // Step 2: Company name confirmation
          <div className="space-y-4">
            {/* Company Info */}
            {company && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{company.name}</p>
                    <p className="text-sm text-gray-600">{company.slug}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Deletion Reason */}
            <div>
              <Label htmlFor="reason" className="text-sm font-medium text-gray-700">
                Reason for deletion (optional):
              </Label>
              <Textarea
                id="reason"
                placeholder="e.g., Company no longer exists, Merger, etc."
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                className="mt-2"
                rows={3}
                disabled={isDeleting}
              />
            </div>

            {/* Final Warning */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium text-red-700">
                    Final confirmation required. This is your last chance to cancel.
                  </p>
                </div>
              </div>
            </div>

            {/* Confirmation Input */}
            <div>
              <Label htmlFor="confirmation" className="text-sm font-medium text-gray-700">
                To confirm deletion, type <span className="font-mono font-bold">{company?.name}</span> below:
              </Label>
              <Input
                id="confirmation"
                type="text"
                placeholder="Enter company name to confirm"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="mt-2 font-mono"
                disabled={isDeleting}
              />
            </div>
          </div>
        )}
        
        <DialogFooter>
          {confirmationStep === 'initial' ? (
            // Step 1: Yes/No buttons
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleNoClick}
                disabled={isDeleting}
              >
                No, Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleYesClick}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                Yes, I'm Sure
              </Button>
            </>
          ) : (
            // Step 2: Cancel/Delete buttons
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={!isConfirmationValid || isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Company
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 