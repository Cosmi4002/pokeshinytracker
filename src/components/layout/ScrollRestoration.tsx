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
        const handleScroll = () => {
            // We only save for specific routes that need it (main Pokedex)
            if (pathname === "/pokedex" || pathname === "/pokedex/manage" || pathname === "/collection") {
                sessionStorage.setItem(`scroll-${pathname}`, window.scrollY.toString());
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [pathname]);

    // Handle immediate restoration for non-async pages
    // Async pages like Pokedex will handle their own restoration after data load
    useEffect(() => {
        const savedPosition = sessionStorage.getItem(`scroll-${pathname}`);

        // If it's not the pokedex (which handles it internally), restore immediately
        if (savedPosition && pathname !== "/pokedex" && pathname !== "/pokedex/manage") {
            window.scrollTo(0, parseInt(savedPosition));
        }

        // Always scrollTo top on new navigations if no saved position exists
        if (!savedPosition) {
            window.scrollTo(0, 0);
        }
    }, [pathname]);

    return null;
}
