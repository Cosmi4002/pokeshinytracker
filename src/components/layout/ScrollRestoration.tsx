import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * A component that handles scroll restoration across routes.
 * It periodically saves the scroll position to sessionStorage 
 * and restores it automatically when navigating back.
 */
export function ScrollRestoration() {
    const { pathname } = useLocation();

    // Save scroll position on scroll
    useEffect(() => {
        let rafId: number | null = null;

        const safeSetScroll = () => {
            try {
                sessionStorage.setItem(`scroll-${pathname}`, window.scrollY.toString());
            } catch {
                // Ignore storage failures (private mode/quota/security policies on some browsers).
            }
        };

        const handleScroll = () => {
            // We only save for specific routes that need it (main Pokedex)
            if (pathname === "/pokedex" || pathname === "/pokedex/manage" || pathname === "/collection") {
                if (rafId !== null) return;
                rafId = window.requestAnimationFrame(() => {
                    rafId = null;
                    safeSetScroll();
                });
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", handleScroll);
            if (rafId !== null) {
                window.cancelAnimationFrame(rafId);
            }
        };
    }, [pathname]);

    // Handle immediate restoration for non-async pages
    // Async pages like Pokedex will handle their own restoration after data load
    useEffect(() => {
        let savedPosition: string | null = null;
        try {
            savedPosition = sessionStorage.getItem(`scroll-${pathname}`);
        } catch {
            savedPosition = null;
        }

        // If it's not the pokedex (which handles it internally), restore immediately
        if (savedPosition && pathname !== "/pokedex" && pathname !== "/pokedex/manage") {
            const parsed = Number.parseInt(savedPosition, 10);
            if (Number.isFinite(parsed)) {
                window.scrollTo(0, parsed);
            }
        }

        // Always scrollTo top on new navigations if no saved position exists
        if (!savedPosition) {
            window.scrollTo(0, 0);
        }
    }, [pathname]);

    return null;
}
