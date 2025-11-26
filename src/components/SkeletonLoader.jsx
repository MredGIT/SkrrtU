import React from 'react'

export function ProfileCardSkeleton() {
  return (
    <div className="w-full max-w-sm h-[580px] bg-white rounded-2xl overflow-hidden shadow-xl animate-pulse">
      <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300"></div>
      <div className="absolute bottom-0 left-0 right-0 p-5 space-y-3">
        <div className="h-8 bg-neutral-300/50 backdrop-blur-sm rounded-lg w-3/4"></div>
        <div className="h-4 bg-neutral-300/50 backdrop-blur-sm rounded w-1/2"></div>
        <div className="flex gap-2">
          <div className="h-8 bg-neutral-300/50 backdrop-blur-sm rounded-full w-20"></div>
          <div className="h-8 bg-neutral-300/50 backdrop-blur-sm rounded-full w-24"></div>
        </div>
      </div>
    </div>
  )
}

export function ChatListSkeleton() {
  return (
    <div className="space-y-2 px-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
          <div className="w-14 h-14 rounded-full bg-neutral-200"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
            <div className="h-3 bg-neutral-200 rounded w-2/3"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function EventCardSkeleton() {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-neutral-200"></div>
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-neutral-200 rounded w-3/4"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-neutral-200 rounded"></div>
        <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
      </div>
    </div>
  )
}
