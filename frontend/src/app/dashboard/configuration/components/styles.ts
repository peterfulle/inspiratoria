// ============================================================================
// CONFIGURATION STYLES
// ============================================================================
export const configStyles = `
  .config-container {
    min-height: 100vh;
    background: #fafafa;
    padding: 2rem;
  }

  .config-header {
    margin-bottom: 2rem;
  }

  .config-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 0.25rem;
  }

  .config-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
  }

  /* Tabs */
  .config-tabs {
    display: flex;
    gap: 0.25rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 0.25rem;
    margin-bottom: 1.5rem;
    overflow-x: auto;
  }

  .config-tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background: transparent;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .config-tab:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .config-tab.active {
    background: #1a1a1a;
    color: white;
  }

  /* Section */
  .section {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .section-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1a1a1a;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .section-body {
    padding: 1.25rem;
  }

  .section-desc {
    font-size: 0.75rem;
    color: #6b7280;
    margin-bottom: 1rem;
  }

  /* Setting Row */
  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 0;
    border-bottom: 1px solid #f3f4f6;
  }

  .setting-row:last-child {
    border-bottom: none;
  }

  .setting-row-info {
    flex: 1;
  }

  .setting-row-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #1a1a1a;
    margin-bottom: 0.125rem;
  }

  .setting-row-desc {
    font-size: 0.75rem;
    color: #6b7280;
  }

  /* Toggle */
  .toggle {
    position: relative;
    width: 2.75rem;
    height: 1.5rem;
    background: #e5e7eb;
    border-radius: 9999px;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .toggle.active {
    background: #1a1a1a;
  }

  .toggle-dot {
    position: absolute;
    top: 0.125rem;
    left: 0.125rem;
    width: 1.25rem;
    height: 1.25rem;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .toggle.active .toggle-dot {
    transform: translateX(1.25rem);
  }

  /* Input */
  .input-field {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: #fafafa;
    transition: all 0.15s ease;
  }

  .input-field:focus {
    outline: none;
    border-color: #1a1a1a;
    background: white;
  }

  .input-field:disabled {
    background: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
  }

  .input-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .input-group {
    margin-bottom: 1rem;
  }

  .input-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.375rem;
  }

  /* Select */
  .select-field {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: #fafafa;
    cursor: pointer;
  }

  .select-field:focus {
    outline: none;
    border-color: #1a1a1a;
    background: white;
  }

  /* Buttons */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #1a1a1a;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-primary:hover {
    background: #2d2d2d;
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #f3f4f6;
    color: #374151;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-secondary:hover {
    background: #e5e7eb;
  }

  .btn-danger {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #dc2626;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-danger:hover {
    background: #b91c1c;
  }

  .btn-danger:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-outline {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: transparent;
    color: #374151;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-outline:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }

  /* Danger Zone */
  .danger-zone {
    background: white;
    border: 1px solid #fecaca;
    border-radius: 0.75rem;
  }

  .danger-zone .section-header {
    background: #fef2f2;
    border-bottom: 1px solid #fecaca;
    border-radius: 0.75rem 0.75rem 0 0;
  }

  .danger-zone .section-title {
    color: #991b1b;
  }

  /* Alert */
  .alert {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
  }

  .alert-warning {
    background: #fef3c7;
    border: 1px solid #fcd34d;
  }

  .alert-warning .alert-icon {
    color: #d97706;
  }

  .alert-warning .alert-text {
    color: #92400e;
  }

  .alert-success {
    background: #d1fae5;
    border: 1px solid #6ee7b7;
  }

  .alert-success .alert-icon {
    color: #059669;
  }

  .alert-success .alert-text {
    color: #065f46;
  }

  .alert-error {
    background: #fee2e2;
    border: 1px solid #fca5a5;
  }

  .alert-error .alert-icon {
    color: #dc2626;
  }

  .alert-error .alert-text {
    color: #991b1b;
  }

  .alert-info {
    background: #dbeafe;
    border: 1px solid #93c5fd;
  }

  .alert-info .alert-icon {
    color: #2563eb;
  }

  .alert-info .alert-text {
    color: #1e40af;
  }

  .alert-icon {
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .alert-content {
    flex: 1;
  }

  .alert-title {
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .alert-text {
    font-size: 0.75rem;
  }

  /* Countdown */
  .countdown {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    background: #f3f4f6;
    border-radius: 50%;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1a1a1a;
    margin: 1rem auto;
  }

  /* Confirmation Input */
  .confirm-container {
    margin-top: 1rem;
  }

  .confirm-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.375rem;
    display: block;
  }

  .confirm-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    font-size: 0.75rem;
  }

  .confirm-status.valid {
    color: #059669;
  }

  .confirm-status.invalid {
    color: #dc2626;
  }

  /* Deleted Results */
  .deleted-results {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .deleted-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    padding: 0.5rem;
    background: #f0fdf4;
    border-radius: 0.375rem;
  }

  .deleted-item-label {
    color: #374151;
  }

  .deleted-item-value {
    font-weight: 600;
    color: #059669;
    font-family: monospace;
  }

  /* Integration Cards */
  .integrations-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .integration-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.25rem;
    transition: all 0.15s ease;
  }

  .integration-card:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .integration-card.connected {
    border-color: #10b981;
    background: #f0fdf4;
  }

  .integration-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .integration-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
  }

  .integration-info {
    flex: 1;
  }

  .integration-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1a1a1a;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .integration-badge {
    font-size: 0.625rem;
    padding: 0.125rem 0.375rem;
    background: #10b981;
    color: white;
    border-radius: 9999px;
    font-weight: 500;
  }

  .integration-badge.recommended {
    background: #6366f1;
  }

  .integration-desc {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.25rem;
    line-height: 1.4;
  }

  .integration-features {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    margin-top: 0.75rem;
  }

  .integration-feature {
    font-size: 0.625rem;
    padding: 0.25rem 0.5rem;
    background: #f3f4f6;
    color: #374151;
    border-radius: 0.25rem;
  }

  .integration-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .integration-actions button {
    flex: 1;
  }

  /* Status Badges */
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.625rem;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    font-weight: 500;
  }

  .status-badge.active {
    background: #d1fae5;
    color: #059669;
  }

  .status-badge.inactive {
    background: #f3f4f6;
    color: #6b7280;
  }

  .status-badge.pending {
    background: #fef3c7;
    color: #d97706;
  }

  /* API Key Display */
  .api-key-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #f3f4f6;
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
    margin-top: 0.5rem;
  }

  .api-key-value {
    flex: 1;
    font-family: monospace;
    font-size: 0.75rem;
    color: #374151;
  }

  .api-key-btn {
    padding: 0.25rem;
    background: transparent;
    border: none;
    color: #6b7280;
    cursor: pointer;
    transition: color 0.15s ease;
  }

  .api-key-btn:hover {
    color: #1a1a1a;
  }

  @media (max-width: 1024px) {
    .integrations-grid {
      grid-template-columns: 1fr;
    }
    .input-row {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .config-tabs {
      flex-wrap: nowrap;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .deleted-results {
      grid-template-columns: 1fr;
    }
  }
`;

export default configStyles;
