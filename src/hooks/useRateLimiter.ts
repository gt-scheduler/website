import { useMemo, useCallback } from 'react';
import useLocalStorageState from 'use-local-storage-state';

interface RateLimiterBucket {
  remainingCount: number;
  lastRefreshTime: string | Date;
}

export default function useRateLimiter(
  bucketName: string,
  capacity: number,
  interval: number
): {
  hasReachedLimit: boolean;
  refreshBucket: () => void;
  decrementBucketCount: () => void;
} {
  const [bucket, setBucket] = useLocalStorageState<RateLimiterBucket>(
    bucketName,
    {
      defaultValue: {
        remainingCount: capacity,
        lastRefreshTime: new Date(),
      },
      storageSync: true,
    }
  );

  const intervalMs = useMemo(() => interval * 1000, [interval]);

  const hasReachedLimit = useMemo(() => {
    return bucket.remainingCount < 0;
  }, [bucket.remainingCount]);

  const refreshBucket = useCallback(() => {
    setBucket((currBucket) => {
      const oldDate = new Date(currBucket.lastRefreshTime);
      const newDate = new Date();
      const isOldDateInvalid = Number.isNaN(oldDate.valueOf());
      if (!isOldDateInvalid) {
        const bucketCountAdded = Math.floor(
          ((newDate.valueOf() - oldDate.valueOf()) / intervalMs) * capacity
        );
        if (bucketCountAdded > 0) {
          return {
            remainingCount: Math.min(
              capacity,
              currBucket.remainingCount +
                bucketCountAdded +
                (currBucket.remainingCount < 0 ? 1 : 0)
            ),
            lastRefreshTime: newDate,
          };
        }
      }

      return {
        remainingCount: Math.min(capacity, currBucket.remainingCount),
        lastRefreshTime: isOldDateInvalid
          ? new Date()
          : currBucket.lastRefreshTime,
      };
    });
  }, [capacity, intervalMs, setBucket]);

  const decrementBucketCount = useCallback(() => {
    setBucket((currBucket) => {
      return {
        ...currBucket,
        remainingCount: currBucket.remainingCount - 1,
      };
    });
  }, [setBucket]);

  return {
    hasReachedLimit,
    refreshBucket,
    decrementBucketCount,
  };
}
