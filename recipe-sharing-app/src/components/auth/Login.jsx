import React, { useContext, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../../context/AuthContext';
import './Auth.css';

const Login = () => {
    const { loginWithGoogle } = useContext(AuthContext);
    const [error, setError] = useState('');

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            await loginWithGoogle(credentialResponse.credential);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleGoogleError = () => {
        setError('Google Sign-In failed. Please try again.');
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            {error && <p className="error">{error}</p>}
            <div className="google-login-wrapper">
                <p>Sign in with your Google account:</p>
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap
                    theme="filled_blue"
                    text="signin_with"
                    shape="pill"
                />
            </div>
            <div className="login-divider">
                <span>OR</span>
            </div>
            <p className="login-note">
                We use Google Sign-In for secure and convenient authentication. 
                Your email and profile information will be used to create your account.
            </p>
        </div>
    );
};

export default Login;