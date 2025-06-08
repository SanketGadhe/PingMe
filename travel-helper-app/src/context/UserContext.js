import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Stores user object
    const [isLoggedIn, setIsLoggedIn] = useState(false); // Boolean auth state
    const [loading, setLoading] = useState(true); // For 
    //initial session check
    const [trip, setTrip] = useState(null)
    useEffect(() => {
        const loadUser = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('@user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                    setIsLoggedIn(true);
                }
            } catch (e) {
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = async (userData) => {
        setUser(userData);
        setIsLoggedIn(true);
        await AsyncStorage.setItem('@user', JSON.stringify(userData));
    };

    const logout = async () => {
        setUser(null);
        setIsLoggedIn(false);
        setTrip(null);
        await AsyncStorage.removeItem('@trip');
        await AsyncStorage.removeItem('@tracking');
    };

    return (
        <UserContext.Provider value={{ user, isLoggedIn, loading, login, logout }}>
            {children}
        </UserContext.Provider>
    );
};

// Hook to use in any component
export const useUser = () => useContext(UserContext);
