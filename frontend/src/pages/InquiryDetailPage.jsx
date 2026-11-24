import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { updateInquiryStatus } from '../api/inquiries';
import { useInquiry } from '../hooks/useInquiry';
import { STATUS_ACTIONS, STATUS_LABELS } from '../constants/status';
import { formatDate } from '../utils/format';
import StatusBadge from '../components/StatusBadge';

function LoadError({ error, onRetry }) {
  const notFound = error.status === 404 || error.status === 400;
  return (
    <div className="card empty">
      <h2>{notFound ? 'Inquiry not found' : "Couldn't load this inquiry"}</h2>
      <p className="muted">
        {notFound
          ? "It may have been removed, the link may be wrong, or you don't have access to it."
          : error.message}
      </p>
      <div className="empty-actions">
        {!notFound && (
          <button className="btn btn-secondary" onClick={onRetry}>Try again</button>
        )}
        <Link to="/inquiries" className="btn">Back to inquiries</Link>
      </div>
    </div>
  );
}

export default function InquiryDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { inquiry, setInquiry, error, reload } = useInquiry(id);
  const [updating, setUpdating] = useState(false);
  const [notice, setNotice] = useState(() =>
    location.state?.flash ? { type: 'success', text: location.state.flash } : null
  );

  // Show the "Inquiry recorded" message once, then clear it from history
  useEffect(() => {
    if (location.state?.flash) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  async function changeStatus(to) {
    setUpdating(true);
    setNotice(null);
    try {
      const updated = await updateInquiryStatus(inquiry.id, to, inquiry.version);
      setInquiry(updated);
      setNotice({ type: 'success', text: `Status changed to ${STATUS_LABELS[updated.status]}.` });
    } catch (err) {
      if (err.code === 'STALE_INQUIRY') {
        // Someone changed it after we loaded it: show the latest version instead of overwriting
        const latest = await reload();
        setNotice({
          type: 'warning',
          text: `Someone else updated this inquiry${
            latest ? ` (it is now ${STATUS_LABELS[latest.status]})` : ''
          }. Check the latest details, then try again if needed.`,
        });
      } else if (err.code === 'INVALID_STATUS_TRANSITION') {
        await reload();
        setNotice({ type: 'error', text: err.message });
      } else {
        setNotice({ type: 'error', text: `Couldn't update the status. ${err.message}` });
      }
    } finally {
      setUpdating(false);
    }
  }

  if (!inquiry) {
    if (error) return <LoadError error={error} onRetry={reload} />;
    return <p className="center muted">Loading inquiry…</p>;
  }

  const actions = STATUS_ACTIONS[inquiry.status] || [];

  return (
    <>
      <Link to="/inquiries" className="back-link">← Back to inquiries</Link>

      {notice && (
        <div
          className={`notice notice-${notice.type}`}
          role={notice.type === 'success' ? 'status' : 'alert'}
        >
          {notice.text}
        </div>
      )}

      <div className="card detail">
        <div className="detail-header">
          <div>
            <p className="muted small">Inquiry #{inquiry.id}</p>
            <h1>{inquiry.subject}</h1>
          </div>
          <StatusBadge status={inquiry.status} />
        </div>

        <dl className="detail-grid">
          <div>
            <dt>Customer</dt>
            <dd>{inquiry.customerName}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>
              {inquiry.contactEmail ? (
                <a href={`mailto:${inquiry.contactEmail}`}>{inquiry.contactEmail}</a>
              ) : '—'}
            </dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>
              {inquiry.contactPhone ? (
                <a href={`tel:${inquiry.contactPhone}`}>{inquiry.contactPhone}</a>
              ) : '—'}
            </dd>
          </div>
          <div>
            <dt>Recorded by</dt>
            <dd>{inquiry.createdBy.name}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{formatDate(inquiry.createdAt)}</dd>
          </div>
          <div>
            <dt>Last updated</dt>
            <dd>{formatDate(inquiry.updatedAt)}</dd>
          </div>
        </dl>

        <h3>Description</h3>
        <p className="description">{inquiry.description}</p>

        <div className="status-actions">
          <h3>Update status</h3>
          <div className="action-buttons">
            {actions.map((action, i) => (
              <button
                key={action.to}
                className={i === 0 ? 'btn' : 'btn btn-secondary'}
                disabled={updating}
                onClick={() => changeStatus(action.to)}
              >
                {action.label}
              </button>
            ))}
            {updating && <span className="muted">Saving…</span>}
          </div>
        </div>
      </div>
    </>
  );
}