/**
 * CINEVINA — Screen Wake Lock Utility & Hook
 * Ngăn chặn thiết bị tự động tắt màn hình (sleep/dim display) khi đang xem phim.
 * Hỗ trợ W3C Screen Wake Lock API tiêu chuẩn (Chrome, Safari iOS 16.4+, Edge, Samsung Internet)
 * kèm cơ chế Fallback NoSleep cho các trình duyệt hoặc WebView cũ hơn.
 */
import { useEffect } from 'react';

class ScreenWakeLockManager {
  private sentinel: any = null;
  private isAcquired: boolean = false;
  private shouldBeActive: boolean = false;
  private fallbackVideo: HTMLVideoElement | null = null;
  private isListeningVisibility: boolean = false;

  constructor() {
    this.initVisibilityListener();
  }

  private initVisibilityListener() {
    if (typeof document === 'undefined' || this.isListeningVisibility) return;
    this.isListeningVisibility = true;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && this.shouldBeActive) {
        // Tái kích hoạt Wake Lock khi người dùng chuyển lại tab/ứng dụng
        this.requestNativeWakeLock().catch(() => {});
      }
    };

    const handleFullscreen = () => {
      if (this.shouldBeActive) {
        this.requestNativeWakeLock().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('fullscreenchange', handleFullscreen);
    document.addEventListener('webkitfullscreenchange', handleFullscreen);
  }

  /**
   * Yêu cầu giữ màn hình luôn sáng.
   */
  public async acquire(): Promise<boolean> {
    this.shouldBeActive = true;
    this.initVisibilityListener();

    // 1. Thử dùng W3C Screen Wake Lock API chính thống
    const nativeSuccess = await this.requestNativeWakeLock();
    if (nativeSuccess) {
      this.isAcquired = true;
      this.stopFallback();
      return true;
    }

    // 2. Nếu Wake Lock API không hỗ trợ hoặc bị chặn, dùng Fallback NoSleep
    this.startFallback();
    return this.isAcquired;
  }

  private async requestNativeWakeLock(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return false;
    }

    try {
      if (this.sentinel && !this.sentinel.released) {
        return true;
      }

      const sentinel = await (navigator as any).wakeLock.request('screen');
      this.sentinel = sentinel;
      this.isAcquired = true;

      sentinel.addEventListener('release', () => {
        this.sentinel = null;
        this.isAcquired = false;
        // Nếu vẫn trong trạng thái cần giữ sáng và trang đang hiển thị, tự động lấy lại lock
        if (this.shouldBeActive && typeof document !== 'undefined' && document.visibilityState === 'visible') {
          this.requestNativeWakeLock().catch(() => {});
        }
      });

      return true;
    } catch (err: any) {
      // Có thể bị từ chối nếu pin quá yếu hoặc trình duyệt hạn chế
      console.warn('[WakeLock] Native Screen Wake Lock request failed:', err?.message || err);
      return false;
    }
  }

  /**
   * Giải phóng Wake Lock khi tạm dừng hoặc thoát khỏi màn hình xem phim.
   */
  public async release(): Promise<void> {
    this.shouldBeActive = false;

    if (this.sentinel) {
      try {
        await this.sentinel.release();
      } catch {}
      this.sentinel = null;
    }

    this.isAcquired = false;
    this.stopFallback();
  }

  /**
   * Trạng thái hiện tại của Wake Lock.
   */
  public isActive(): boolean {
    return this.isAcquired;
  }

  /**
   * NoSleep Fallback: Sử dụng video micro câm chạy ngầm để giữ trình duyệt không sleep.
   */
  private startFallback(): void {
    if (typeof document === 'undefined') return;

    try {
      if (!this.fallbackVideo) {
        const video = document.createElement('video');
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.setAttribute('muted', '');
        video.muted = true;
        video.loop = true;
        video.style.position = 'fixed';
        video.style.left = '-9999px';
        video.style.top = '-9999px';
        video.style.width = '1px';
        video.style.height = '1px';
        video.style.opacity = '0.01';
        video.style.pointerEvents = 'none';
        video.src = 'data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQAAADpmcmVlAAABA21kYXQAAAAAAAAB/w==';
        document.body.appendChild(video);
        this.fallbackVideo = video;
      }

      const playPromise = this.fallbackVideo.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isAcquired = true;
          })
          .catch(() => {
            // Cần tương tác người dùng trước khi autoplay
          });
      }
    } catch {}
  }

  private stopFallback(): void {
    if (this.fallbackVideo) {
      try {
        this.fallbackVideo.pause();
        if (this.fallbackVideo.parentNode) {
          this.fallbackVideo.parentNode.removeChild(this.fallbackVideo);
        }
      } catch {}
      this.fallbackVideo = null;
    }
  }
}

export const wakeLock = new ScreenWakeLockManager();

/**
 * React Hook tự động bật/tắt Screen Wake Lock theo trạng thái phát video.
 */
export function useScreenWakeLock(enabled: boolean = true) {
  useEffect(() => {
    if (enabled) {
      wakeLock.acquire();
    } else {
      wakeLock.release();
    }

    return () => {
      wakeLock.release();
    };
  }, [enabled]);
}
