import { useNavigate } from 'react-router-dom';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import useLoginContext from './useLoginContext';
import { createUser, loginUser, requestTwoFactorCode } from '../services/userService';
import { SafeDatabaseUser } from '../types/types';
import { clearRememberedUser, loadRememberedUser, saveRememberedUser } from '../utils/authStorage';

/**
 * Custom hook to manage authentication logic, including handling input changes,
 * form submission, password visibility toggling, and error validation for both
 * login and signup processes.
 *
 * @param authType - Specifies the authentication type ('login' or 'signup').
 * @returns {Object} An object containing:
 *   - username: The current value of the username input.
 *   - password: The current value of the password input.
 *   - passwordConfirmation: The current value of the password confirmation input (for signup).
 *   - showPassword: Boolean indicating whether the password is visible.
 *   - err: The current error message, if any.
 *   - handleInputChange: Function to handle changes in input fields.
 *   - handleSubmit: Function to handle form submission.
 *   - togglePasswordVisibility: Function to toggle password visibility.
 */
const useAuth = (authType: 'login' | 'signup') => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState<string>('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState<string>('');
  const [twoFactorDevCode, setTwoFactorDevCode] = useState<string | null>(null);
  const [isSendingTwoFactorCode, setIsSendingTwoFactorCode] = useState(false);
  const [twoFactorOptIn, setTwoFactorOptIn] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(() => !!loadRememberedUser());
  const [twoFactorEmail, setTwoFactorEmail] = useState<string>('');

  const { setUser } = useLoginContext();
  const navigate = useNavigate();

  /**
   * Toggles the visibility of the password input field.
   */
  const togglePasswordVisibility = () => {
    setShowPassword(prevState => !prevState);
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: 'username' | 'password' | 'confirmPassword' | 'twoFactor',
  ) => {
    const value = e.target.value;

    if (field === 'username') {
      setUsername(value.trim());
      return;
    }

    if (field === 'password') {
      setPassword(value);

      // Validate password only on signup
      if (authType === 'signup') {
        const isValid = value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);

        if (!isValid) {
          setErr('Password must be at least 8 characters and contain a letter and number');
        } else {
          setErr('');
        }
      }

      return;
    }

    if (field === 'confirmPassword') {
      setPasswordConfirmation(value);

      if (authType === 'signup') {
        if (value !== password) {
          setErr('Passwords do not match');
        } else {
          setErr('');
        }
      }

      return;
    }

    if (field === 'twoFactor') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
      setTwoFactorCode(digitsOnly);
    }
  };

  /**
   * Validates the input fields for the form.
   * Ensures required fields are filled and passwords match (for signup).
   *
   * @returns {boolean} True if inputs are valid, false otherwise.
   */
  const validateInputs = (): boolean => {
    if (username === '' || password === '') {
      setErr('Please enter a username and password');
      return false;
    }

    if (authType === 'signup' && password !== passwordConfirmation) {
      setErr('Passwords do not match');
      return false;
    }

    if (requires2FA && twoFactorCode.length !== 6) {
      setErr('Enter the 6-digit verification code');
      return false;
    }

    return true;
  };

  const resetTwoFactorFlow = (keepError = false) => {
    setRequires2FA(false);
    setTwoFactorCode('');
    setTwoFactorDevCode(null);
    if (!keepError) {
      setErr('');
    }
  };

  const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleRequestTwoFactorCode = async (): Promise<boolean> => {
    if (!username) {
      setErr('Enter your username before requesting a verification code');
      return false;
    }

    const emailForCode = twoFactorEmail.trim();
    if (!emailForCode || !isValidEmail(emailForCode)) {
      setErr('Enter a valid email address to receive the verification code');
      return false;
    }

    setIsSendingTwoFactorCode(true);
    try {
      const response = await requestTwoFactorCode(username, emailForCode);
      setRequires2FA(true);
      setTwoFactorDevCode(response.code ?? null);
      setTwoFactorCode('');
      setErr('Enter the 6-digit verification code we just sent you');
      return true;
    } catch (error) {
      setErr((error as Error).message);
      return false;
    } finally {
      setIsSendingTwoFactorCode(false);
    }
  };

  const cancelTwoFactorFlow = () => {
    resetTwoFactorFlow();
    setTwoFactorOptIn(false);
  };

  useEffect(() => {
    if (requires2FA && !twoFactorOptIn) {
      setTwoFactorOptIn(true);
    }
  }, [requires2FA, twoFactorOptIn]);

  const handleTwoFactorOptInChange = (checked: boolean) => {
    setTwoFactorOptIn(checked);

    if (checked) {
      setErr('');
      return;
    }

    if (!requires2FA) {
      cancelTwoFactorFlow();
    }
  };

  const handleRememberDeviceChange = (checked: boolean) => {
    setRememberDevice(checked);
    if (!checked) {
      clearRememberedUser();
    }
  };

  const handleTwoFactorEmailChange = (value: string) => {
    setTwoFactorEmail(value);
  };

  /**
   * Handles the submission of the form.
   * Validates input, performs login/signup, and navigates to the home page on success.
   *
   * @param event - The form submission event.
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateInputs()) return;

    try {
      if (authType === 'signup') {
        const user = await createUser({ username, password });
        setUser(user);
        if (twoFactorOptIn) {
          navigate(`/user/${user.username}`);
        } else {
          navigate('/home');
        }
        return;
      }

      const result = await loginUser(
        { username, password },
        {
          twoFactorCode: requires2FA ? twoFactorCode : undefined,
          rememberDevice,
        },
      );

      if ('requires2FA' in result && result.requires2FA) {
        setTwoFactorOptIn(true);
        setErr(
          'Two-factor authentication required. Enter your email to receive a verification code.',
        );
        return;
      }

      setUser(result as SafeDatabaseUser);
      if (rememberDevice) {
        saveRememberedUser(result as SafeDatabaseUser);
      } else {
        clearRememberedUser();
      }
      navigate('/home');
    } catch (error) {
      setErr((error as Error).message);
      if (requires2FA) {
        setTwoFactorCode('');
      } else {
        resetTwoFactorFlow(true);
      }
    }
  };

  return {
    username,
    password,
    passwordConfirmation,
    showPassword,
    err,
    requires2FA,
    twoFactorCode,
    twoFactorDevCode,
    isSendingTwoFactorCode,
    twoFactorOptIn,
    twoFactorEmail,
    rememberDevice,
    handleInputChange,
    handleSubmit,
    togglePasswordVisibility,
    handleRequestTwoFactorCode,
    cancelTwoFactorFlow,
    handleTwoFactorOptInChange,
    handleRememberDeviceChange,
    handleTwoFactorEmailChange,
  };
};

export default useAuth;
