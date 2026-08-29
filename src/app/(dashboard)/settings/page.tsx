'use client';

import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    date_tolerance_days: 7,
    amount_tolerance: 10,
    auto_match_threshold: 95,
    review_threshold: 70,
    currency: 'INR',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.settings) setSettings(data.settings);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Configure reconciliation parameters</p>
      </div>

      <Card title="Reconciliation Settings">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Date Tolerance (days)"
              type="number"
              value={String(settings.date_tolerance_days)}
              onChange={(e) => setSettings({ ...settings, date_tolerance_days: parseInt(e.target.value) || 7 })}
              helperText="Maximum days between invoice and payment dates for a match"
            />
            <Input
              label="Amount Tolerance"
              type="number"
              value={String(settings.amount_tolerance)}
              onChange={(e) => setSettings({ ...settings, amount_tolerance: parseFloat(e.target.value) || 10 })}
              helperText="Maximum amount difference allowed for a match"
            />
            <Input
              label="Auto-Match Threshold (%)"
              type="number"
              value={String(settings.auto_match_threshold)}
              onChange={(e) => setSettings({ ...settings, auto_match_threshold: parseFloat(e.target.value) || 95 })}
              helperText="Confidence score above which matches are auto-approved"
            />
            <Input
              label="Review Threshold (%)"
              type="number"
              value={String(settings.review_threshold)}
              onChange={(e) => setSettings({ ...settings, review_threshold: parseFloat(e.target.value) || 70 })}
              helperText="Confidence score above which matches require review"
            />
          </div>
          <Select
            label="Default Currency"
            value={settings.currency}
            onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
            options={[
              { value: 'INR', label: 'INR (Indian Rupee)' },
              { value: 'USD', label: 'USD (US Dollar)' },
            ]}
          />
          <div className="flex justify-end">
            <Button variant="primary" icon={<Save className="w-4 h-4" />} onClick={saveSettings} loading={saving}>Save Settings</Button>
          </div>
        </div>
      </Card>

      <Card title="About ReconcileAI">
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>Build:</strong> Production MVP</p>
          <p>ReconcileAI uses a deterministic scoring engine combined with AI-powered explanations to match invoices with bank transactions and payment gateway records.</p>
        </div>
      </Card>
    </div>
  );
}
