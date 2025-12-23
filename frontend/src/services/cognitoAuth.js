import { signIn, signUp, signOut, getCurrentUser, fetchAuthSession, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';

// Sign up new user
export const signUpUser = async (username, password, attributes = {}) => {
  try {
    const { userId, nextStep } = await signUp({
      username,
      password,
      options: {
        userAttributes: attributes,
      },
    });
    return { success: true, userId, nextStep };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Sign in user
export const signInUser = async (username, password) => {
  try {
    // First, check if there's already a signed-in user and sign them out
    try {
      await getCurrentUser();
      // User is already signed in, sign them out first
      console.log('Existing session found, signing out...');
      await signOut();
    } catch (e) {
      // No existing session, that's fine
    }

    // Now sign in
    const result = await signIn({
      username,
      password,
    });
    
    console.log('Sign-in result:', {
      isSignedIn: result.isSignedIn,
      nextStep: result.nextStep,
    });
    
    return { 
      success: true, 
      isSignedIn: result.isSignedIn, 
      nextStep: result.nextStep 
    };
  } catch (error) {
    // Handle UserAlreadyAuthenticatedException by signing out and retrying
    if (error.name === 'UserAlreadyAuthenticatedException') {
      try {
        console.log('User already authenticated, signing out and retrying...');
        await signOut();
        // Retry sign in
        const result = await signIn({
          username,
          password,
        });
        return { 
          success: true, 
          isSignedIn: result.isSignedIn, 
          nextStep: result.nextStep 
        };
      } catch (retryError) {
        console.error('Sign-in error after retry:', retryError);
        return { success: false, error: retryError.message };
      }
    }
    
    // For other errors, log and return failure
    console.error('Sign-in error:', error);
    return { success: false, error: error.message };
  }
};

// Sign out user
export const signOutUser = async () => {
  try {
    await signOut();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get current authenticated user
export const getCurrentAuthUser = async () => {
  try {
    const user = await getCurrentUser();
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get ID token for API calls
export const getIdToken = async () => {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || null;
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = async () => {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
};

// Confirm email/phone verification
export const confirmVerification = async (username, confirmationCode) => {
  try {
    await confirmSignUp({
      username,
      confirmationCode,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Resend verification code
export const resendVerificationCode = async (username) => {
  try {
    await resendSignUpCode({ username });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

