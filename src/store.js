// src/store.js
import { createStore, combineReducers } from 'redux';
import authReducer from './reducers/authReducer';

const rootReducer = combineReducers({
  auth: authReducer,
  // Add other reducers if needed
});

const loadState = () => {
  try {
    const serializedState = localStorage.getItem('token');
    return serializedState ? JSON.parse(serializedState) : undefined;
  } catch (error) {
    return undefined;
  }
};

const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('token', serializedState);
  } catch (error) {
    console.error('Error saving state to localStorage:', error);
  }
};

const preloadedState = loadState();
const store = createStore(rootReducer, preloadedState);

store.subscribe(() => {
  saveState(store.getState());
});

export default store;