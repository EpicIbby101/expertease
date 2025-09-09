import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
  children: React.ReactNode
}

export function LoadingButton({ 
  loading = false, 
  loadingText = "Loading...",
  children, 
  className,
  disabled,
  ...props 
}: LoadingButtonProps) {
  return (
    <Button 
      disabled={disabled || loading} 
      className={cn(className)}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {loading ? loadingText : children}
    </Button>
  )
} 