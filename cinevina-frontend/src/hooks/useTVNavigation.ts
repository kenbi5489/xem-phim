import { useEffect, useCallback } from 'react';

/**
 * A lightweight spatial navigation hook for Android TV / D-pad.
 * It listens to Arrow keys and moves focus to the nearest element with data-tv-focusable="true".
 */
export function useTVNavigation() {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only handle D-pad keys
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
      return;
    }

    const activeElement = document.activeElement as HTMLElement;

    if (e.key === 'Enter') {
      if (activeElement && activeElement.hasAttribute('data-tv-focusable')) {
        e.preventDefault();
        activeElement.click();
      }
      return;
    }

    // Check if the active element can scroll in the requested direction
    if (activeElement) {
      if (e.key === 'ArrowDown' && activeElement.scrollTop + activeElement.clientHeight < activeElement.scrollHeight - 1) {
        return; // Let browser natively scroll down
      }
      if (e.key === 'ArrowUp' && activeElement.scrollTop > 0) {
        return; // Let browser natively scroll up
      }
    }

    e.preventDefault();

    const focusables = Array.from(document.querySelectorAll('[data-tv-focusable="true"]')) as HTMLElement[];
    if (focusables.length === 0) return;

    // If no element is focused or active element is not a TV focusable, focus the first one (or sidebar)
    if (!activeElement || !activeElement.hasAttribute('data-tv-focusable')) {
      focusables[0].focus();
      return;
    }

    const currentRect = activeElement.getBoundingClientRect();
    let bestMatch: HTMLElement | null = null;
    let minDistance = Infinity;

    focusables.forEach((el) => {
      if (el === activeElement) return;

      const rect = el.getBoundingClientRect();
      let isCandidate = false;
      let distance = Infinity;

      // Simple center-to-center distance calculation combined with directional filtering
      const currentCenterX = currentRect.left + currentRect.width / 2;
      const currentCenterY = currentRect.top + currentRect.height / 2;
      const elCenterX = rect.left + rect.width / 2;
      const elCenterY = rect.top + rect.height / 2;

      const dx = elCenterX - currentCenterX;
      const dy = elCenterY - currentCenterY;

      // Ensure the element is generally in the direction of the keypress
      // and calculate a weighted distance
      if (e.key === 'ArrowRight' && dx > 0 && Math.abs(dy) <= dx * 1.5) {
        isCandidate = true;
        distance = dx + Math.abs(dy) * 3; // Heavily penalize vertical drift when moving horizontal
      } else if (e.key === 'ArrowLeft' && dx < 0 && Math.abs(dy) <= Math.abs(dx) * 1.5) {
        isCandidate = true;
        distance = Math.abs(dx) + Math.abs(dy) * 3;
      } else if (e.key === 'ArrowDown' && dy > 0 && Math.abs(dx) <= dy * 1.5) {
        isCandidate = true;
        distance = dy + Math.abs(dx) * 3; // Heavily penalize horizontal drift when moving vertical
      } else if (e.key === 'ArrowUp' && dy < 0 && Math.abs(dx) <= Math.abs(dy) * 1.5) {
        isCandidate = true;
        distance = Math.abs(dy) + Math.abs(dx) * 3;
      }

      // If no strict candidate found, fallback to pure Euclidean distance for that general half-plane
      if (!isCandidate) {
        if (e.key === 'ArrowRight' && dx > 0) { isCandidate = true; distance = dx * dx + dy * dy; }
        if (e.key === 'ArrowLeft' && dx < 0) { isCandidate = true; distance = dx * dx + dy * dy; }
        if (e.key === 'ArrowDown' && dy > 0) { isCandidate = true; distance = dx * dx + dy * dy; }
        if (e.key === 'ArrowUp' && dy < 0) { isCandidate = true; distance = dx * dx + dy * dy; }
      }

      if (isCandidate && distance < minDistance) {
        minDistance = distance;
        bestMatch = el;
      }
    });

    if (bestMatch) {
      (bestMatch as HTMLElement).focus();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
