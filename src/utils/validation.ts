export const validation = {
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  isStrongPassword: (password: string): boolean => {
    return password.length >= 8;
  }
};
