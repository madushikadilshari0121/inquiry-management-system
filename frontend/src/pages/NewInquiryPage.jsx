import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createInquiry } from '../api/inquiries';
import { validateInquiry } from '../validation/inquiry';
import FormField from '../components/FormField';

const EMPTY = {
  customerName: '',
  contactEmail: '',
  contactPhone: '',
  subject: '',
  description: '',
};

export default function NewInquiryPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null); // { message, existingId? }
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear the error for a field as soon as the user edits it
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      if (name === 'contactPhone') delete next.contactEmail; // "email or phone" rule lives on email
      return next;
    });
  }

  // Props shared by every input, including accessibility attributes
  function inputProps(name) {
    return {
      id: name,
      name,
      value: values[name],
      onChange: handleChange,
      'aria-invalid': errors[name] ? 'true' : undefined,
      'aria-describedby': errors[name] ? `${name}-error` : undefined,
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);

    const clientErrors = validateInquiry(values);
    setErrors(clientErrors);
    const firstInvalid = Object.keys(clientErrors)[0];
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const inquiry = await createInquiry({
        customerName: values.customerName.trim(),
        contactEmail: values.contactEmail.trim(),
        contactPhone: values.contactPhone.trim(),
        subject: values.subject.trim(),
        description: values.description.trim(),
      });
      navigate(`/inquiries/${inquiry.id}`, { state: { flash: 'Inquiry recorded.' } });
    } catch (err) {
      if (err.code === 'VALIDATION_ERROR' && Array.isArray(err.details)) {
        // The API rejected the data: show its messages next to the right fields
        const serverErrors = {};
        err.details.forEach((d) => {
          if (d.field && !serverErrors[d.field]) serverErrors[d.field] = d.message;
        });
        setErrors(serverErrors);
        setFormError({ message: 'Please fix the highlighted fields.' });
      } else if (err.code === 'DUPLICATE_INQUIRY') {
        setFormError({ message: err.message, existingId: err.details?.existingId });
      } else {
        setFormError({
          message: `Couldn't save the inquiry. ${err.message} Your details are still here, so you can try again.`,
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Link to="/inquiries" className="back-link">← Back to inquiries</Link>

      <form className="card form" onSubmit={handleSubmit} noValidate>
        <h1>New inquiry</h1>
        <p className="muted">Record a customer request so the team can follow it up.</p>

        {formError && (
          <div className="error" role="alert">
            {formError.message}{' '}
            {formError.existingId && (
              <Link to={`/inquiries/${formError.existingId}`}>View the existing inquiry</Link>
            )}
          </div>
        )}

        <FormField id="customerName" label="Customer name" error={errors.customerName}>
          <input {...inputProps('customerName')} autoComplete="off" />
        </FormField>

        <div className="grid-2">
          <FormField
            id="contactEmail"
            label="Email"
            error={errors.contactEmail}
            hint="Email or phone, at least one is required"
          >
            <input {...inputProps('contactEmail')} type="email" autoComplete="off" />
          </FormField>

          <FormField id="contactPhone" label="Phone" error={errors.contactPhone}>
            <input {...inputProps('contactPhone')} type="tel" autoComplete="off" />
          </FormField>
        </div>

        <FormField id="subject" label="Subject" error={errors.subject}>
          <input {...inputProps('subject')} maxLength={150} />
        </FormField>

        <FormField
          id="description"
          label="Description"
          error={errors.description}
          hint={`${values.description.length}/2000`}
        >
          <textarea {...inputProps('description')} rows={5} maxLength={2000} />
        </FormField>

        <div className="form-actions">
          <Link to="/inquiries" className="btn btn-secondary">Cancel</Link>
          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save inquiry'}
          </button>
        </div>
      </form>
    </>
  );
}