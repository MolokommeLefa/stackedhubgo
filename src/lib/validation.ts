const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string) {
  const value = email.trim();
  if (!value) return "Enter your email address.";
  if (!emailPattern.test(value)) return "Enter a valid email, for example name@stackedfoods.co.za.";
  return null;
}

export function validatePassword(password: string, { min = 8 } = {}) {
  if (!password) return "Enter a password.";
  if (password.length < min) return `Password must be at least ${min} characters.`;
  return null;
}

export function validateName(name: string) {
  if (!name.trim()) return "Enter your name.";
  if (name.trim().length < 2) return "Name must be at least 2 characters.";
  return null;
}
