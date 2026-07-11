'use client';

import { useState } from 'react';

export default function ProfilePage() {
  const [firstName, setFirstName] = useState('Jane');
  const [lastName, setLastName] = useState('Doe');
  const [displayName, setDisplayName] = useState('JaneD');
  const [country, setCountry] = useState('AU');
  const [timezone, setTimezone] = useState('Australia/Sydney');
  const [proficiency, setProficiency] = useState('intermediate');
  const [studyHistory, setStudyHistory] = useState('3');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
    }, 1000);
  };

  return (
    <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.25rem' }}>Personal Profile</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Update your settings, residency country, and English learning metrics.
        </p>
      </div>

      {success && (
        <div
          className="premium-card"
          style={{ background: 'var(--success-bg)', borderLeft: '4px solid var(--success)', padding: '1rem' }}
        >
          <p style={{ color: 'var(--success)', fontWeight: '500', fontSize: '0.875rem' }}>
            ✓ Profile saved successfully!
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="glass-card"
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="firstName">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              className="form-input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="lastName">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              className="form-input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="displayName">
            Display Name
          </label>
          <input
            type="text"
            id="displayName"
            className="form-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="country">
              Country
            </label>
            <select
              id="country"
              className="form-input"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              style={{ appearance: 'none', WebkitAppearance: 'none' }}
            >
              <option value="AU">Australia</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="IN">India</option>
              <option value="CA">Canada</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="timezone">
              Timezone
            </label>
            <select
              id="timezone"
              className="form-input"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              style={{ appearance: 'none', WebkitAppearance: 'none' }}
            >
              <option value="Australia/Sydney">Sydney (AEST)</option>
              <option value="America/New_York">New York (EST)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Asia/Kolkata">Kolkata (IST)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="proficiency">
              English Level
            </label>
            <select
              id="proficiency"
              className="form-input"
              value={proficiency}
              onChange={(e) => setProficiency(e.target.value)}
              style={{ appearance: 'none', WebkitAppearance: 'none' }}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="native">Native Speaker</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="studyHistory">
              Study History (Months)
            </label>
            <input
              type="number"
              id="studyHistory"
              className="form-input"
              min="0"
              value={studyHistory}
              onChange={(e) => setStudyHistory(e.target.value)}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile Settings'}
        </button>
      </form>
    </div>
  );
}
