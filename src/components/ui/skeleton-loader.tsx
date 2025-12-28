import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'task' | 'stat' | 'client';
}

export function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  if (variant === 'stat') {
    return (
      <div className={cn("animate-pulse rounded-xl bg-card border border-border p-6", className)} {...props}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-10 w-10 bg-muted rounded-lg" />
        </div>
        <div className="h-8 w-32 bg-muted rounded mb-2" />
        <div className="h-3 w-24 bg-muted rounded mb-4" />
        <div className="h-12 w-full bg-muted rounded" />
      </div>
    );
  }

  if (variant === 'task') {
    return (
      <div className={cn("animate-pulse rounded-lg bg-card border border-border p-3", className)} {...props}>
        <div className="flex justify-between items-start mb-2">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-5 w-20 bg-muted rounded" />
        </div>
        <div className="h-3 w-28 bg-muted rounded mb-2" />
        <div className="h-3 w-full bg-muted rounded mb-2" />
        <div className="flex justify-between items-center pt-2 border-t border-dashed border-border">
          <div className="h-4 w-12 bg-muted rounded" />
          <div className="flex gap-1">
            <div className="h-6 w-6 bg-muted rounded-full" />
            <div className="h-6 w-6 bg-muted rounded-full" />
            <div className="h-6 w-6 bg-muted rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn("animate-pulse rounded-lg bg-card border border-border p-4", className)} {...props}>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 bg-muted rounded-full" />
          <div className="flex-1">
            <div className="h-4 w-32 bg-muted rounded mb-2" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        </div>
        <div className="h-3 w-full bg-muted rounded mb-2" />
        <div className="h-3 w-3/4 bg-muted rounded" />
      </div>
    );
  }

  if (variant === 'client') {
    return (
      <div className={cn("animate-pulse rounded-xl bg-card border border-border p-4", className)} {...props}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-muted rounded-full" />
            <div>
              <div className="h-5 w-32 bg-muted rounded mb-2" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-muted rounded" />
            <div className="h-8 w-8 bg-muted rounded" />
            <div className="h-8 w-8 bg-muted rounded" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 bg-muted rounded-lg" />
          <div className="h-16 bg-muted rounded-lg" />
          <div className="h-16 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

// Skeleton containers for different views
export function ScheduleViewSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="animate-pulse flex items-center justify-between p-4 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-muted rounded-full" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-muted rounded" />
          <div className="h-8 w-20 bg-muted rounded" />
        </div>
      </div>

      {/* Month tabs skeleton */}
      <div className="animate-pulse flex gap-2 p-4 overflow-x-auto">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-10 w-24 bg-muted rounded-lg shrink-0" />
        ))}
      </div>

      {/* Days grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="animate-pulse bg-card border border-border rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="h-6 w-20 bg-muted rounded" />
              <div className="h-4 w-16 bg-muted rounded" />
            </div>
            <div className="space-y-3">
              <Skeleton variant="task" />
              <Skeleton variant="task" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClientsViewSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse bg-card border border-border rounded-xl p-4">
            <div className="h-4 w-20 bg-muted rounded mb-2" />
            <div className="h-8 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Client list skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} variant="client" />
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4">
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} variant="stat" />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="animate-pulse bg-card border border-border rounded-xl p-6">
          <div className="h-6 w-40 bg-muted rounded mb-4" />
          <div className="h-64 bg-muted rounded" />
        </div>
        <div className="animate-pulse bg-card border border-border rounded-xl p-6">
          <div className="h-6 w-40 bg-muted rounded mb-4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}
