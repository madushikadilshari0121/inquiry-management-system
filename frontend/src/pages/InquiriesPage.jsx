import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { STATUSES, STATUS_LABELS } from '../constants/status';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useInquiryList } from '../hooks/useInquiryList';
import StatusBadge from '../components/StatusBadge';

function formatDate(value) {
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function InquiriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 300);

  // Keep the URL in sync with the (debounced) search box
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (debouncedSearch) next.set('search', debouncedSearch);
        else next.delete('search');
        return next;
      },
      { replace: true }
    );
  }, [debouncedSearch, setSearchParams]);

  const { inquiries, loading, error, reload } = useInquiryList({ status, search });
  const hasFilters = Boolean(status || search);

  function handleStatusChange(e) {
    const value = e.target.value;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set('status', value);
        else next.delete('status');
        return next;
      },
      { replace: true }
    );
  }

  function clearFilters() {
    setSearchInput('');
    setSearchParams({}, { replace: true });
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Inquiries</h1>
          <p className="muted">
            {inquiries ? `${inquiries.length} shown` : ' '}
            {loading && inquiries && ' · Updating…'}
          </p>
        </div>
        <Link to="/inquiries/new" className="btn">+ New inquiry</Link>
      </div>

      <div className="card filters">
        <div>
          <label htmlFor="search">Search</label>
          <input
            id="search"
            type="search"
            placeholder="Customer, subject, email or phone"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="status">Status</label>
          <select id="status" value={status} onChange={handleStatusChange}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="error" role="alert">
          Couldn't load inquiries: {error.message}{' '}
          <button className="btn-link" onClick={reload}>Try again</button>
        </div>
      )}

      {inquiries === null && !error && <p className="center muted">Loading inquiries…</p>}

      {inquiries && inquiries.length === 0 && (
        <div className="card empty">
          {hasFilters ? (
            <>
              <p>No inquiries match your filters.</p>
              <button className="btn btn-secondary" onClick={clearFilters}>Clear filters</button>
            </>
          ) : (
            <>
              <p>No inquiries yet.</p>
              <Link to="/inquiries/new" className="btn">Record the first inquiry</Link>
            </>
          )}
        </div>
      )}

      {inquiries && inquiries.length > 0 && (
        <ul className="inquiry-list">
          {inquiries.map((inq) => (
            <li key={inq.id}>
              <Link to={`/inquiries/${inq.id}`} className="card inquiry-row">
                <div>
                  <strong>{inq.subject}</strong>
                  <p className="muted small">
                    {inq.customerName} · {inq.contactEmail || inq.contactPhone}
                  </p>
                </div>
                <div className="row-meta">
                  <StatusBadge status={inq.status} />
                  <span className="muted small">Updated {formatDate(inq.updatedAt)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}