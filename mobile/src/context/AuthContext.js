import React, { createContext, useEffect, useReducer, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client'; // axios instance

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            userToken: action.token,
            user: action.user,
            isLoading: false,
          };

        case 'SIGN_IN':
          return {
            ...prevState,
            userToken: action.token,
            user: action.user,
            isLoading: false,
          };

        case 'SIGN_OUT':
          return {
            ...prevState,
            userToken: null,
            user: null,
            isLoading: false,
          };

        default:
          return prevState;
      }
    },
    {
      isLoading: true,
      userToken: null,
      user: null,
    }
  );

  // APP AÇILINCA TOKEN KONTROLÜ
  useEffect(() => {
    const loadStorage = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userData = await AsyncStorage.getItem('userData');

        dispatch({
          type: 'RESTORE_TOKEN',
          token: token,
          user: userData ? JSON.parse(userData) : null,
        });
      } catch (e) {
        console.log("TOKEN LOAD ERROR", e);
      }
    };

    loadStorage();
  }, []);

  // LOGIN – BACKEND'E İSTEĞİ AXIOS İLE AT
  const authContext = useMemo(
    () => ({
      signIn: async (email, password, expectedRole) => {
        try {
          const response = await api.post('/auth/login', {
            email,
            password,
            expectedRole,
          });

          const { token, user } = response.data;

          // Client-side role enforcement: block login if returned role
          // does not match the panel's expected role.
          if (expectedRole && user?.role && user.role !== expectedRole) {
            // Ensure no auth state is persisted
            try {
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userData');
            } catch (e) {
              console.log('Error clearing storage after role mismatch', e);
            }

            dispatch({ type: 'SIGN_OUT' });

            throw new Error('Bu hesap bu panel için kayıtlı değil.');
          }

          await AsyncStorage.setItem('userToken', token);
          await AsyncStorage.setItem('userData', JSON.stringify(user));

          dispatch({ type: 'SIGN_IN', token, user });

          return user;
        } catch (error) {
          console.log(error);
          const message =
            (error && error.response && error.response.data && error.response.data.message) ||
            (error && error.message) ||
            'Login failed';
          throw new Error(message);
        }
      },

      // REGISTER - do not auto-login after signup
      signUp: async (name, email, password, phone, role) => {
        try {
          const response = await api.post('/auth/register', {
            name,
            email,
            password,
            phone,
            role,
          });

          // Ensure no auth state is persisted after registration
          try {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
          } catch (e) {
            console.log('Error clearing storage after register', e);
          }

          dispatch({ type: 'SIGN_OUT' });

          return response.data;
        } catch (error) {
          const message = (error && error.response && error.response.data && error.response.data.message) ||
            (error && error.message) ||
            'Register failed';
          throw new Error(message);
        }
      },

      // ÇIKIŞ
      signOut: async () => {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');

        dispatch({ type: 'SIGN_OUT' });
      },
    }),
    []
  );

  return (
    <AuthContext.Provider value={{ ...state, ...authContext }}>
      {children}
    </AuthContext.Provider>
  );
};
