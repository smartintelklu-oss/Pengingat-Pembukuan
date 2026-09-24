import { useState, useEffect, useRef, useCallback } from 'react';
import { AppTab } from '../types';

export interface ModalHandlers {
  [key: string]: () => void;
}

interface UseAndroidBackHandlerOptions {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  modalCloseHandlers: ModalHandlers;
}

export function useAndroidBackHandler({
  activeTab,
  setActiveTab,
  modalCloseHandlers,
}: UseAndroidBackHandlerOptions) {
  const [showExitToast, setShowExitToast] = useState(false);

  // References to keep state fresh in event listeners without re-binding
  const activeTabRef = useRef<AppTab>(activeTab);
  activeTabRef.current = activeTab;

  const modalCloseHandlersRef = useRef<ModalHandlers>(modalCloseHandlers);
  modalCloseHandlersRef.current = modalCloseHandlers;

  // Stack of open modals: e.g. ['reminder'], ['transaction'], etc.
  const openModalsRef = useRef<string[]>([]);

  // Stack of visited tabs for back navigation
  const tabHistoryRef = useRef<AppTab[]>(['home']);

  // Flag to differentiate programmatic history.back() vs Android hardware/gesture back
  const isProgrammaticBackRef = useRef(false);

  // Double-tap on Home to exit tracker
  const lastBackPressTimeRef = useRef<number>(0);

  // Seed history on initial mount so Android has history states to pop
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // Replace base state
      window.history.replaceState(
        { appScope: 'catatan_pengingat', level: 'root', tab: 'home' },
        ''
      );

      // If starting on a tab other than 'home', push it
      if (activeTab !== 'home') {
        window.history.pushState(
          { appScope: 'catatan_pengingat', level: 'tab', tab: activeTab },
          ''
        );
      } else {
        // Push a cushion state so first back press on home doesn't instantly exit
        window.history.pushState(
          { appScope: 'catatan_pengingat', level: 'cushion', tab: 'home' },
          ''
        );
      }
    } catch (e) {
      console.warn('[AndroidBackHandler] Init history state warning:', e);
    }
  }, []);

  // Main listener for popstate (triggered by Android hardware back, edge swipe, or browser back)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (event: PopStateEvent) => {
      // 1. If back was triggered programmatically (e.g. user clicked X on modal), skip
      if (isProgrammaticBackRef.current) {
        isProgrammaticBackRef.current = false;
        return;
      }

      // 2. Priority 1: If any modal / pop-up is currently open, close the topmost modal
      if (openModalsRef.current.length > 0) {
        const topModal = openModalsRef.current.pop();
        if (topModal && modalCloseHandlersRef.current[topModal]) {
          // Trigger the modal close handler
          modalCloseHandlersRef.current[topModal]();
          return;
        }
      }

      // 3. Priority 2: If currently on a subpage (not 'home'), navigate back to previous tab or home
      if (activeTabRef.current !== 'home') {
        // Pop previous tab from history stack
        let prevTab = tabHistoryRef.current.pop();
        // If popped tab is current tab, get the next one
        if (prevTab === activeTabRef.current) {
          prevTab = tabHistoryRef.current.pop();
        }

        const targetTab: AppTab = prevTab || 'home';
        setActiveTab(targetTab);
        return;
      }

      // 4. Priority 3: User is on 'home' with no modal open
      // Implement standard Android UX: "Tekan sekali lagi untuk keluar" (Double-tap to exit)
      const now = Date.now();
      if (now - lastBackPressTimeRef.current < 2000) {
        // Pressed back twice in <= 2 seconds -> Allow exiting
        setShowExitToast(false);
        // Let the default back proceed or exit
        window.history.back();
      } else {
        // First press -> Show exit confirmation toast
        lastBackPressTimeRef.current = now;
        setShowExitToast(true);
        setTimeout(() => setShowExitToast(false), 2000);

        // Re-push cushion state so Android doesn't close the app on this first tap
        try {
          window.history.pushState(
            { appScope: 'catatan_pengingat', level: 'cushion', tab: 'home' },
            ''
          );
        } catch (e) {
          console.warn('[AndroidBackHandler] Re-push cushion error:', e);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [setActiveTab]);

  // Handler to call when opening any modal
  const handleOpenModal = useCallback((modalKey: string, openCallback: () => void) => {
    if (openModalsRef.current[openModalsRef.current.length - 1] !== modalKey) {
      openModalsRef.current.push(modalKey);
      try {
        window.history.pushState(
          { appScope: 'catatan_pengingat', level: 'modal', modalKey },
          ''
        );
      } catch (e) {
        console.warn('[AndroidBackHandler] pushState modal error:', e);
      }
    }
    openCallback();
  }, []);

  // Handler to call when closing any modal from UI (e.g. clicking 'X' or 'Batal')
  const handleCloseModal = useCallback((modalKey: string, closeCallback: () => void) => {
    const idx = openModalsRef.current.lastIndexOf(modalKey);
    if (idx !== -1) {
      openModalsRef.current.splice(idx, 1);
      isProgrammaticBackRef.current = true;
      try {
        window.history.back();
      } catch (e) {
        console.warn('[AndroidBackHandler] history.back error:', e);
      }
    }
    closeCallback();
  }, []);

  // Handler to navigate between tabs
  const handleNavigateTab = useCallback((nextTab: AppTab) => {
    if (nextTab === activeTabRef.current) return;

    // Close any dangling modals before switching tabs
    while (openModalsRef.current.length > 0) {
      const topModal = openModalsRef.current.pop();
      if (topModal && modalCloseHandlersRef.current[topModal]) {
        modalCloseHandlersRef.current[topModal]();
      }
    }

    // Push previous tab to history stack
    if (activeTabRef.current !== nextTab) {
      tabHistoryRef.current.push(activeTabRef.current);
    }

    try {
      window.history.pushState(
        { appScope: 'catatan_pengingat', level: 'tab', tab: nextTab },
        ''
      );
    } catch (e) {
      console.warn('[AndroidBackHandler] pushState tab error:', e);
    }

    setActiveTab(nextTab);
  }, [setActiveTab]);

  // Handler for explicit back action (e.g. from PageGlassHeader back button)
  const handleGoBack = useCallback(() => {
    if (openModalsRef.current.length > 0) {
      const topModal = openModalsRef.current.pop();
      if (topModal && modalCloseHandlersRef.current[topModal]) {
        modalCloseHandlersRef.current[topModal]();
        return;
      }
    }

    if (activeTabRef.current !== 'home') {
      let prevTab = tabHistoryRef.current.pop();
      if (prevTab === activeTabRef.current) {
        prevTab = tabHistoryRef.current.pop();
      }
      const targetTab: AppTab = prevTab || 'home';
      setActiveTab(targetTab);
    }
  }, [setActiveTab]);

  return {
    showExitToast,
    handleOpenModal,
    handleCloseModal,
    handleNavigateTab,
    handleGoBack,
  };
}
