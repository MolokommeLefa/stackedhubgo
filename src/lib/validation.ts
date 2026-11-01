const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const zaPhonePattern = /^0\d{9}$/;

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

export function validatePhoneZa(phone: string) {
  if (!zaPhonePattern.test(phone.replace(/\s/g, ""))) {
    return "Enter a 10-digit phone number, e.g. 082 123 4567.";
  }
  return null;
}

export function validateScheduleWindow(scheduledFor: string, now = Date.now()) {
  const selectedTime = new Date(scheduledFor).getTime();
  const minTime = now + 45 * 60 * 1000;
  const maxTime = now + 7 * 24 * 60 * 60 * 1000;
  if (
    !scheduledFor ||
    !Number.isFinite(selectedTime) ||
    selectedTime < minTime ||
    selectedTime > maxTime
  ) {
    return "Choose a time at least 45 minutes from now and within the next 7 days.";
  }
  return null;
}

export function validateDemoCard(input: {
  cardholder: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
}) {
  const digits = input.cardNumber.replace(/\D/g, "");
  if (
    input.cardholder.trim().length < 2 ||
    digits !== "4242424242424242" ||
    !/^\d{2}\/\d{2}$/.test(input.cardExpiry) ||
    input.cardCvv !== "123"
  ) {
    return "Demo payment declined. Use card 4242 4242 4242 4242, expiry 12/30, and CVV 123.";
  }
  return null;
}
