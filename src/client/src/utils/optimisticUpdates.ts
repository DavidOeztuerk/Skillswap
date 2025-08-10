/**
 * Optimistic Updates Utility
 * 
 * Provides utilities for implementing optimistic UI updates with rollback capabilities
 */

import { toast } from 'react-toastify';

/**
 * Represents an optimistic update that can be rolled back
 */
export interface OptimisticUpdate<T = any> {
  id: string;
  type: string;
  previousState: T;
  newState: T;
  timestamp: number;
  rollback: () => void;
}

/**
 * Manages pending optimistic updates
 */
class OptimisticUpdateManager {
  private pendingUpdates: Map<string, OptimisticUpdate> = new Map();
  private updateTimeout: Map<string, NodeJS.Timeout> = new Map();
  private readonly TIMEOUT_DURATION = 10000; // 10 seconds timeout

  /**
   * Register a new optimistic update
   */
  register<T>(update: OptimisticUpdate<T>): void {
    this.pendingUpdates.set(update.id, update);
    
    // Set timeout for automatic rollback if no confirmation
    const timeout = setTimeout(() => {
      this.rollback(update.id, 'Update timed out');
    }, this.TIMEOUT_DURATION);
    
    this.updateTimeout.set(update.id, timeout);
  }

  /**
   * Confirm a successful update
   */
  confirm(updateId: string): void {
    const timeout = this.updateTimeout.get(updateId);
    if (timeout) {
      clearTimeout(timeout);
      this.updateTimeout.delete(updateId);
    }
    this.pendingUpdates.delete(updateId);
  }

  /**
   * Rollback a failed update
   */
  rollback(updateId: string, reason?: string): void {
    const update = this.pendingUpdates.get(updateId);
    if (update) {
      update.rollback();
      
      // Clear timeout
      const timeout = this.updateTimeout.get(updateId);
      if (timeout) {
        clearTimeout(timeout);
        this.updateTimeout.delete(updateId);
      }
      
      // Remove from pending
      this.pendingUpdates.delete(updateId);
      
      // Show error message
      if (reason) {
        toast.error(reason, {
          position: 'bottom-right',
          autoClose: 3000,
        });
      }
    }
  }

  /**
   * Check if an update is pending
   */
  isPending(updateId: string): boolean {
    return this.pendingUpdates.has(updateId);
  }

  /**
   * Get all pending updates
   */
  getPendingUpdates(): OptimisticUpdate[] {
    return Array.from(this.pendingUpdates.values());
  }

  /**
   * Clear all pending updates (use with caution)
   */
  clearAll(): void {
    // Clear all timeouts
    this.updateTimeout.forEach(timeout => clearTimeout(timeout));
    this.updateTimeout.clear();
    this.pendingUpdates.clear();
  }
}

// Singleton instance
export const optimisticUpdateManager = new OptimisticUpdateManager();

/**
 * Helper function to create an optimistic update with automatic rollback
 */
export function createOptimisticUpdate<T>(
  id: string,
  type: string,
  previousState: T,
  newState: T,
  rollbackAction: () => void
): OptimisticUpdate<T> {
  return {
    id,
    type,
    previousState,
    newState,
    timestamp: Date.now(),
    rollback: rollbackAction,
  };
}

/**
 * Wrapper for async actions with optimistic updates
 */
export async function withOptimisticUpdate<R>(
  updateId: string,
  optimisticAction: () => void,
  asyncAction: () => Promise<R>,
  rollbackAction: () => void,
  options?: {
    showSuccess?: boolean;
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (result: R) => void;
    onError?: (error: Error) => void;
  }
): Promise<R | null> {
  // Apply optimistic update
  optimisticAction();
  
  // Register the update
  const update = createOptimisticUpdate(
    updateId,
    'generic',
    null,
    null,
    rollbackAction
  );
  optimisticUpdateManager.register(update);
  
  try {
    // Perform async action
    const result = await asyncAction();
    
    // Confirm the update
    optimisticUpdateManager.confirm(updateId);
    
    // Show success message if configured
    if (options?.showSuccess && options?.successMessage) {
      toast.success(options.successMessage, {
        position: 'bottom-right',
        autoClose: 2000,
      });
    }
    
    // Call success callback
    if (options?.onSuccess) {
      options.onSuccess(result);
    }
    
    return result;
  } catch (error) {
    // Rollback on error
    optimisticUpdateManager.rollback(
      updateId,
      options?.errorMessage || 'Operation failed'
    );
    
    // Call error callback
    if (options?.onError) {
      options.onError(error as Error);
    }
    
    return null;
  }
}

/**
 * Check network connectivity before optimistic update
 */
export function canPerformOptimisticUpdate(): boolean {
  if (!navigator.onLine) {
    toast.warning('You are offline. Changes will sync when reconnected.', {
      position: 'bottom-right',
      autoClose: 5000,
    });
    return false;
  }
  return true;
}

/**
 * Generate unique update ID
 */
export function generateUpdateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}