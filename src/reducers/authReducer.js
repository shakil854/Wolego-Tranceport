import { LOGIN, LOGOUT } from '../actions/actionTypes';

const initialState = {
    token: localStorage.getItem('token') || null,
};

const authReducer = (state = initialState, action) => {
    switch (action.type) {
        case LOGIN:
            // Store the token directly in localStorage
            localStorage.setItem('token', action.payload);
            return { ...state, token: action.payload };
        case LOGOUT:
            // Remove the token from localStorage
            localStorage.removeItem('token');
            return { ...state, token: null };
        default:
            return state;
    }
};

export default authReducer;