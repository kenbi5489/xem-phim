/**
 * CINEVINA — Screen Wake Lock & PWA Keep-Awake Engine
 * Ngăn chặn thiết bị tự động tắt màn hình (sleep/dim display) khi đang xem phim,
 * đặc biệt tối ưu cho iPadOS / iOS khi người dùng cài đặt ứng dụng dưới dạng PWA (Home Screen WebClip).
 * 
 * Khắc phục triệt để WebKit Bug 254545 (Screen Wake Lock API bị iOS bỏ qua trong PWA standalone mode)
 * bằng cơ chế bảo vệ đa tầng (Triple-Layer Defense):
 * 1. W3C Screen Wake Lock API tiêu chuẩn (Chrome, Edge, Android, iOS Safari 16.4+, iOS 18.4+ PWA)
 * 2. Background Media Engine: Video H.264 + AAC loop (/nosleep.mp4) giữ active display assertion trên WebKit
 * 3. Web Audio Context Ticker: Duy trì CoreAudio session tránh bị SpringBoard daemon ngắt
 */
import { useEffect } from 'react';

export const isIOSDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

export const isStandalonePWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches
  );
};

class ScreenWakeLockManager {
  private sentinel: any = null;
  private isAcquired: boolean = false;
  private shouldBeActive: boolean = false;
  private fallbackVideo: HTMLVideoElement | null = null;
  private audioCtx: AudioContext | null = null;
  private audioOsc: OscillatorNode | null = null;
  private isListeningEvents: boolean = false;

  constructor() {
    this.initEventListeners();
  }

  private initEventListeners() {
    if (typeof document === 'undefined' || this.isListeningEvents) return;
    this.isListeningEvents = true;

    const handleResume = () => {
      if (this.shouldBeActive) {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          this.requestNativeWakeLock().catch(() => {});
          this.ensureMediaPlayback();
        }
      }
    };

    // User gesture listener: iOS WebKit yêu cầu gesture để phát media ngầm
    const handleUserGesture = () => {
      if (this.shouldBeActive) {
        this.ensureMediaPlayback();
        if (!this.sentinel) {
          this.requestNativeWakeLock().catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('pageshow', handleResume);
    document.addEventListener('fullscreenchange', handleResume);
    document.addEventListener('webkitfullscreenchange', handleResume);

    // Bắt sự kiện chạm / click của người dùng để kích hoạt media session
    window.addEventListener('click', handleUserGesture, { passive: true });
    window.addEventListener('touchstart', handleUserGesture, { passive: true });
    window.addEventListener('touchend', handleUserGesture, { passive: true });
  }

  /**
   * Kích hoạt chế độ giữ màn hình luôn sáng.
   */
  public async acquire(): Promise<boolean> {
    this.shouldBeActive = true;
    this.initEventListeners();

    // 1. Luôn thử Screen Wake Lock API tiêu chuẩn
    const nativeSuccess = await this.requestNativeWakeLock();

    // 2. Trên iOS / iPadOS (đặc biệt là PWA Standalone do dính WebKit Bug 254545)
    // hoặc khi native wake lock không được hỗ trợ: BẮT BUỘC chạy song song Video Engine & Audio Ticker
    const isApple = isIOSDevice();
    const isPWA = isStandalonePWA();

    if (isApple || isPWA || !nativeSuccess) {
      this.startVideoEngine();
      this.startAudioEngine();
    }

    this.isAcquired = true;
    return true;
  }

  /**
   * Giải phóng Wake Lock khi người dùng tạm dừng hoặc thoát khỏi màn hình xem phim.
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
    this.stopVideoEngine();
    this.stopAudioEngine();
  }

  public isActive(): boolean {
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

      sentinel.addEventListener('release', () => {
        this.sentinel = null;
        if (this.shouldBeActive && typeof document !== 'undefined' && document.visibilityState === 'visible') {
          this.requestNativeWakeLock().catch(() => {});
        }
      });

      return true;
    } catch (err: any) {
      console.warn('[WakeLock] Native Screen Wake Lock request failed:', err?.message || err);
      return false;
    }
  }

  /**
   * Video Engine: Sử dụng tệp nosleep.mp4 (H.264 chuẩn + AAC câm) chạy ngầm để giữ WebKit Power Assertion
   */
  private startVideoEngine(): void {
    if (typeof document === 'undefined') return;

    try {
      if (!this.fallbackVideo) {
        const video = document.createElement('video');
        video.setAttribute('title', 'CINEVINA Keep Awake');
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.setAttribute('muted', '');
        video.muted = true;
        video.loop = true;
        video.autoplay = true;
        video.preload = 'auto';

        // Đặt ở vị trí thực tế trong DOM (không dùng opacity:0 hoặc offscreen quá xa vì iOS WebKit sẽ tối ưu tạm dừng)
        video.style.position = 'fixed';
        video.style.bottom = '1px';
        video.style.right = '1px';
        video.style.width = '2px';
        video.style.height = '2px';
        video.style.opacity = '0.01';
        video.style.pointerEvents = 'none';
        video.style.zIndex = '-9999';

        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        video.src = `${origin}/nosleep.mp4`;

        video.addEventListener('ended', () => {
          if (this.shouldBeActive) {
            video.currentTime = 0;
            video.play().catch(() => {});
          }
        });

        video.addEventListener('pause', () => {
          if (this.shouldBeActive) {
            video.play().catch(() => {});
          }
        });

        document.body.appendChild(video);
        this.fallbackVideo = video;
      }

      this.ensureMediaPlayback();
    } catch (err) {
      console.warn('[WakeLock] Video Engine initialization error:', err);
    }
  }

  private ensureMediaPlayback(): void {
    if (this.fallbackVideo && this.shouldBeActive) {
      const playPromise = this.fallbackVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Sẽ tự động kích hoạt lại qua handleUserGesture khi người dùng chạm vào màn hình
        });
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended' && this.shouldBeActive) {
      this.audioCtx.resume().catch(() => {});
    }
  }

  private stopVideoEngine(): void {
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

  /**
   * Web Audio Ticker: Duy trì CoreAudio session ngầm ở mức âm lượng 0.00001 (không nghe thấy)
   */
  private startAudioEngine(): void {
    if (typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      if (!this.audioOsc) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        gain.gain.value = 0.00001; // Hoàn toàn câm/inaudible
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        this.audioOsc = osc;
      }
    } catch {}
  }

  private stopAudioEngine(): void {
    if (this.audioOsc) {
      try {
        this.audioOsc.stop();
        this.audioOsc.disconnect();
      } catch {}
      this.audioOsc = null;
    }

    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
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
