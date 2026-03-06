
export const isStrongPassword = (message = 'Password must have at least one uppercase letter, one number, and one special character.') => ({
    handler: (value: string | undefined) => {
      const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/; // Regex to check for uppercase, number, and special character
      return regex.test(value || ''); // Validate against the regex
    },
    message,
  });
  