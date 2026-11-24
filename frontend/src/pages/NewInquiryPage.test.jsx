import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import NewInquiryPage from './NewInquiryPage';
import { createInquiry } from '../api/inquiries';
import { ApiError } from '../api/client';

// Replace the real API call with a fake we control
vi.mock('../api/inquiries', () => ({ createInquiry: vi.fn() }));

function renderPage() {
  return render(
    <MemoryRouter>
      <NewInquiryPage />
    </MemoryRouter>
  );
}

async function fillValidForm(user) {
  await user.type(screen.getByLabelText('Customer name'), 'Nimal Perera');
  await user.type(screen.getByLabelText('Email'), 'nimal@mail.com');
  await user.type(screen.getByLabelText('Subject'), 'Order delay');
  await user.type(screen.getByLabelText('Description'), 'My order has not arrived.');
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('New inquiry form', () => {
  test('shows field errors and does not call the API when required fields are missing', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /save inquiry/i }));

    expect(screen.getByText('Customer name is required')).toBeInTheDocument();
    expect(screen.getByText('Provide an email or a phone number')).toBeInTheDocument();
    expect(screen.getByText('Subject is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Customer name')).toHaveFocus();
    expect(createInquiry).not.toHaveBeenCalled();
  });

  test('shows a validation error from the API next to the matching field', async () => {
    createInquiry.mockRejectedValue(
      new ApiError(400, 'VALIDATION_ERROR', 'Some fields are invalid', [
        { field: 'contactEmail', message: 'Email domain is not allowed' },
      ])
    );
    const user = userEvent.setup();
    renderPage();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /save inquiry/i }));

    expect(await screen.findByText('Email domain is not allowed')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Please fix the highlighted fields.');
  });

  test('keeps what the user typed when saving fails', async () => {
    createInquiry.mockRejectedValue(
      new ApiError(503, 'SERVER_UNAVAILABLE', 'The server is not responding right now.')
    );
    const user = userEvent.setup();
    renderPage();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /save inquiry/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save the inquiry.");
    expect(screen.getByLabelText('Customer name')).toHaveValue('Nimal Perera');
    expect(screen.getByLabelText('Subject')).toHaveValue('Order delay');
    expect(screen.getByRole('button', { name: /save inquiry/i })).toBeEnabled();
  });
});