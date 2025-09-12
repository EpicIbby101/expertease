'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { toast } from 'sonner';
import { Wrench } from 'lucide-react';

export function FixCompanyNamesButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleFix = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/fix-company-names', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fix company names');
      }

      if (data.success) {
        toast.success(`✅ ${data.message}`);
        if (data.results && data.results.length > 0) {
          const successCount = data.results.filter((r: any) => r.status === 'success').length;
          const errorCount = data.results.filter((r: any) => r.status === 'error').length;
          const warningCount = data.results.filter((r: any) => r.status === 'warning').length;
          
          if (successCount > 0) {
            toast.success(`Fixed ${successCount} users successfully`);
          }
          if (warningCount > 0) {
            toast.warning(`${warningCount} users had missing companies`);
          }
          if (errorCount > 0) {
            toast.error(`${errorCount} users failed to update`);
          }
        }
      } else {
        toast.error('Failed to fix company names');
      }
    } catch (error) {
      console.error('Error fixing company names:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fix company names');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoadingButton
      onClick={handleFix}
      loading={isLoading}
      loadingText="Fixing..."
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <Wrench className="h-4 w-4" />
      Fix Company Names
    </LoadingButton>
  );
}
