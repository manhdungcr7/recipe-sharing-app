import { useState, useEffect } from 'react';

const useNotification = () => {
    const [notifications, setNotifications] = useState([]);
    const [isVisible, setIsVisible] = useState(false);

    const addNotification = (message) => {
        setNotifications((prev) => [...prev, message]);
        setIsVisible(true);
    };

    const removeNotification = (index) => {
        setNotifications((prev) => prev.filter((_, i) => i !== index));
    };

    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                setNotifications([]);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    return {
        notifications,
        isVisible,
        addNotification,
        removeNotification,
    };
};

export default useNotification;