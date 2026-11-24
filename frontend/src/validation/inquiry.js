const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9\s-]{7,20}$/; // same rule as the backend

// Returns an object like { customerName: 'Customer name is required' }
// An empty object means the form is valid.
export function validateInquiry(values) {
  const errors = {};
  const name = values.customerName.trim();
  const email = values.contactEmail.trim();
  const phone = values.contactPhone.trim();
  const subject = values.subject.trim();
  const description = values.description.trim();

  if (!name) errors.customerName = 'Customer name is required';
  else if (name.length > 100) errors.customerName = 'Keep the name under 100 characters';

  if (!email && !phone) errors.contactEmail = 'Provide an email or a phone number';
  else if (email && !EMAIL_RE.test(email)) errors.contactEmail = 'Enter a valid email address';

  if (phone && !PHONE_RE.test(phone)) errors.contactPhone = 'Enter a valid phone number';

  if (!subject) errors.subject = 'Subject is required';
  else if (subject.length > 150) errors.subject = 'Keep the subject under 150 characters';

  if (!description) errors.description = 'Description is required';
  else if (description.length > 2000) errors.description = 'Keep the description under 2000 characters';

  return errors;
}