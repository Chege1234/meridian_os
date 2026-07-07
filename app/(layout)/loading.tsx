'use client';

export default function Loading() {
  return (
    <div className="w-full h-full min-h-[400px] flex flex-col space-y-6 p-4 animate-pulse">
      {/* Title & Description Skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-md w-1/4" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3" />
      </div>

      {/* Grid of Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>

      {/* Large Content Block Skeleton */}
      <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-lg w-full" />
    </div>
  );
}
