// import history from "@history.js";
import { createSlice } from "@reduxjs/toolkit";

import jwtAuthService from "../../../app/services/jwtAuthService";
import localStorageService from "../../../app/services/localStorageService";

// Retrieve the auth_user from localStorage
const storedUser = localStorageService.getItem("auth_user");
// Check if storedUser has accessToken property
const isAuthenticated = storedUser && storedUser.accessToken ? true : false;
const initialState = {
  loading: false,
  success: false,
  user: storedUser ? storedUser.user : undefined,
  errorMessage: null,
  accessToken: storedUser ? storedUser.accessToken : undefined,
  isAuthenticated,
  error: { username: null, password: null }
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUserData: (state, action) => {
      const user = action.payload;
      state = { ...state, ...user };
    },

    userLoggedIn: (state, action) => {
      state.isAuthenticated = true;
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      localStorageService.setItem("auth_user", { accessToken: action.payload.accessToken, user: action.payload.user });
    },

    userLoggedOut: (state) => {
      state.isAuthenticated = false;
      state.accessToken = undefined;
      state.user = undefined;
      localStorage.removeItem("auth_user");
    },

    resetPassword: (state, action) => {
      state.success = true;
      state.loading = false;
      console.log(action.payload.email);
    },

    requestStart: (state, action) => {
      state.loading = true;
    },

    loginWithEmailAndPassword: (state, action) => {
      try {
        const user = action.payload;
        state = {
          ...state,
          user,
          success: true,
          loading: false,
          isAuthenticated: true,
          accessToken: user.token
        };

        localStorageService.setItem("auth_user", { accessToken: user.token, user });
      } catch (error) {
        console.log(error);
      }
    },

    logoutJWTUser: (state) => {
      jwtAuthService.logout();
      state.user = undefined;
      state.isAuthenticated = false;
    }
  }
});

export const {
  setUserData,
  userLoggedIn,
  userLoggedOut,
  resetPassword,
  logoutJWTUser,
  loginWithEmailAndPassword
} = authSlice.actions;

export default authSlice.reducer;
