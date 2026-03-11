// ═══════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════

export const pageStyles = `
  .programs-page {
    min-height: 100vh;
    background: #fafafa;
    color: #1a1a1a;
  }
  .programs-header {
    background: white;
    border-bottom: 1px solid #f0f0f0;
  }
  .stat-card {
    background: white;
    border: 1px solid #f0f0f0;
    border-radius: 16px;
    padding: 24px;
    transition: all 0.2s ease;
  }
  .stat-card:hover {
    box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  }
  .glass-card {
    background: white;
    border: 1px solid #f0f0f0;
    border-radius: 16px;
  }
  .btn-primary {
    background: #1a1a1a;
    color: white;
    padding: 10px 20px;
    border-radius: 10px;
    font-weight: 500;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  .btn-primary:hover {
    background: #333;
  }
  .btn-secondary {
    background: white;
    color: #1a1a1a;
    padding: 10px 20px;
    border-radius: 10px;
    font-weight: 500;
    font-size: 14px;
    border: 1px solid #e5e5e5;
    transition: all 0.2s ease;
  }
  .btn-secondary:hover {
    background: #f5f5f5;
  }
  .btn-ghost {
    background: transparent;
    color: #666;
    padding: 8px 12px;
    border-radius: 8px;
    font-weight: 500;
    font-size: 13px;
    transition: all 0.15s ease;
  }
  .btn-ghost:hover {
    background: #f5f5f5;
    color: #1a1a1a;
  }
  .btn-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: 1px solid #e5e5e5;
    background: white;
    color: #666;
    transition: all 0.15s ease;
  }
  .btn-icon:hover {
    background: #f5f5f5;
    color: #1a1a1a;
  }
  .btn-icon.active {
    background: #1a1a1a;
    color: white;
    border-color: #1a1a1a;
  }
  .badge {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
  }
  .badge-published { background: #dcfce7; color: #16a34a; }
  .badge-draft { background: #f3f4f6; color: #6b7280; }
  .badge-leadership { background: #dbeafe; color: #2563eb; }
  .badge-sales { background: #fef3c7; color: #d97706; }
  .badge-tech { background: #f3e8ff; color: #7c3aed; }
  .badge-diversity { background: #fce7f3; color: #db2777; }
  .badge-operations { background: #e0f2fe; color: #0369a1; }
  .section-title {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #999;
    margin-bottom: 16px;
  }
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
    backdrop-filter: blur(4px);
  }
  .modal-content {
    background: white;
    border-radius: 20px;
    max-width: 1000px;
    width: 95%;
    max-height: 90vh;
    overflow-y: auto;
  }
  .modal-lg {
    max-width: 1200px;
  }
  .input-field {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #e5e5e5;
    border-radius: 10px;
    font-size: 14px;
    transition: all 0.15s ease;
    background: white;
  }
  .input-field:focus {
    outline: none;
    border-color: #1a1a1a;
    box-shadow: 0 0 0 3px rgba(0,0,0,0.05);
  }
  .select-field {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #e5e5e5;
    border-radius: 10px;
    font-size: 14px;
    background: white;
    cursor: pointer;
  }
  .select-field:focus {
    outline: none;
    border-color: #1a1a1a;
  }
  .textarea-field {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #e5e5e5;
    border-radius: 10px;
    font-size: 14px;
    min-height: 100px;
    resize: vertical;
  }
  .textarea-field:focus {
    outline: none;
    border-color: #1a1a1a;
  }
  .program-card {
    background: white;
    border: 1px solid #f0f0f0;
    border-radius: 16px;
    padding: 24px;
    transition: all 0.2s ease;
  }
  .program-card:hover {
    box-shadow: 0 8px 30px rgba(0,0,0,0.06);
    border-color: #e0e0e0;
  }
  .program-row {
    background: white;
    border: 1px solid #f0f0f0;
    border-radius: 12px;
    padding: 16px 24px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 24px;
  }
  .program-row:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.04);
    border-color: #e0e0e0;
  }
  .module-item {
    padding: 16px;
    background: #fafafa;
    border-radius: 10px;
    border: 1px solid #f0f0f0;
    transition: all 0.15s ease;
  }
  .module-item:hover {
    background: #f5f5f5;
  }
  .module-item.expanded {
    background: white;
    border-color: #e0e0e0;
  }
  .filter-btn {
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #666;
    transition: all 0.15s ease;
    border: 1px solid transparent;
  }
  .filter-btn:hover {
    background: #f5f5f5;
  }
  .filter-btn.active {
    background: #1a1a1a;
    color: white;
  }
  .toggle-switch {
    position: relative;
    width: 44px;
    height: 24px;
    background: #e5e5e5;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .toggle-switch.active {
    background: #1a1a1a;
  }
  .toggle-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .toggle-switch.active::after {
    left: 22px;
  }
  .config-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0;
    border-bottom: 1px solid #f5f5f5;
  }
  .config-row:last-child {
    border-bottom: none;
  }
  .number-input {
    width: 80px;
    padding: 8px 12px;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    font-size: 14px;
    text-align: center;
  }
  .number-input:focus {
    outline: none;
    border-color: #1a1a1a;
  }
  .tab-nav {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid #f0f0f0;
    padding: 0 24px;
  }
  .tab-btn {
    padding: 12px 16px;
    font-size: 13px;
    font-weight: 500;
    color: #666;
    border-bottom: 2px solid transparent;
    transition: all 0.15s ease;
    margin-bottom: -1px;
  }
  .tab-btn:hover {
    color: #333;
  }
  .tab-btn.active {
    color: #1a1a1a;
    border-bottom-color: #1a1a1a;
  }
  .resource-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #fafafa;
    border-radius: 8px;
    transition: all 0.15s ease;
  }
  .resource-item:hover {
    background: #f5f5f5;
  }
  .activity-item {
    padding: 12px;
    background: #fafafa;
    border-radius: 8px;
    border-left: 3px solid #1a1a1a;
  }
  .milestone-item {
    display: flex;
    gap: 16px;
    padding: 16px;
    background: #fafafa;
    border-radius: 10px;
  }
  .milestone-marker {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #1a1a1a;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }
  .drag-handle {
    cursor: grab;
    color: #ccc;
    transition: color 0.15s ease;
  }
  .drag-handle:hover {
    color: #666;
  }
  .empty-state {
    text-align: center;
    padding: 40px;
    color: #999;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;
