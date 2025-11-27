import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FullscreenContextType {
    isFullscreen: boolean;
    setIsFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
}

const FullscreenContext = createContext<FullscreenContextType | undefined>(undefined);

export const FullscreenProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    return (
        <FullscreenContext.Provider value={{ isFullscreen, setIsFullscreen }}>
            {children}
        </FullscreenContext.Provider>
    );
};

export const useFullscreen = () => {
    const context = useContext(FullscreenContext);
    if (!context) {
        throw new Error('useFullscreen must be used within a FullscreenProvider');
    }
    return context;
};
