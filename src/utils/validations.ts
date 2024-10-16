const validateName = (val: string) => {
  const regex = /^[A-Za-z0-9._]+$/;

  if (!val) return "name_is_required";
  if (val.length < 4) return "too_short";
  if (val.length > 16) return "too_long";
  if (val.includes("..") || val.includes("__") || !regex.test(val)) return "incorrect_format";

  return true;
};

const validateEmail = (val: string) => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!val) return "email_is_required";
  if (val.length < 4) return "too_short";
  if (val.length > 254) return "too_long";
  if (!regex.test(val)) {
    return "incorrect_format";
  }

  return true;
};

const validatePassword = (val: string) => {
  if (!val) return "password_is_required";
  if (val.length < 8) return "too_short";

  return true;
};

export { validateEmail, validateName, validatePassword };
