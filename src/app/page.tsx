import {
  Layers,
  Upload,
  Brain,
  GitMerge,
  CheckCircle,
  BarChart3,
  Shield,
  ScrollText,
  Building,
  ArrowRight,
  Zap,
  AlertTriangle,
  Eye,
  BarChart,
  Repeat,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

const steps = [
  { icon: Upload, label: 'Upload Data', description: 'Import invoices, bank statements & gateway data' },
  { icon: Brain, label: 'AI Analysis', description: 'ML models analyze patterns and relationships' },
  { icon: GitMerge, label: 'Auto-Reconcile', description: 'Intelligent matching across all sources' },
  { icon: CheckCircle, label: 'Review & Fix', description: 'Explainable results with manual overrides' },
  { icon: BarChart3, label: 'Generate Reports', description: 'Comprehensive audit-ready reports' },
];

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Matching',
    description: 'Advanced machine learning algorithms automatically match transactions across invoices, bank statements, and payment gateways.',
  },
  {
    icon: AlertTriangle,
    title: 'Smart Exception Detection',
    description: 'Automatically flag discrepancies, duplicates, and anomalies with configurable rules and thresholds.',
  },
  {
    icon: Eye,
    title: 'Explainable AI',
    description: 'Every match comes with a clear explanation of how and why the AI made its decision for full audit transparency.',
  },
  {
    icon: BarChart,
    title: 'Real-time Analytics',
    description: 'Live dashboards showing reconciliation status, match rates, exception trends, and processing metrics.',
  },
  {
    icon: Repeat,
    title: 'Multi-Source Reconciliation',
    description: 'Seamlessly reconcile data from multiple systems including ERPs, banks, and payment processors.',
  },
  {
    icon: FileText,
    title: 'Automated Reports',
    description: 'Generate comprehensive reconciliation reports with drill-down capabilities for compliance and audits.',
  },
];

const trustBadges = [
  { icon: Shield, label: 'Secure' },
  { icon: ScrollText, label: 'Auditable' },
  { icon: Brain, label: 'Explainable' },
  { icon: Building, label: 'Enterprise-Ready' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-7 h-7 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">ReconcileAI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-100 rounded-full opacity-50 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-50 rounded-full opacity-50 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Reconcile financial data with{' '}
              <span className="text-indigo-600">intelligence.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Automatically match invoices, bank transactions, and payment gateway records with explainable AI.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
              >
                Start Reconciliation
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all"
              >
                View Demo
              </Link>
            </div>
          </div>

          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-gray-500 ml-2">ReconcileAI Dashboard</span>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 bg-indigo-50 rounded-xl p-4">
                    <p className="text-xs text-indigo-600 font-medium">Total Reconciled</p>
                    <p className="text-2xl font-bold text-indigo-700">2,847</p>
                    <p className="text-xs text-green-600 mt-1">+12.5% from last month</p>
                  </div>
                  <div className="flex-1 bg-green-50 rounded-xl p-4">
                    <p className="text-xs text-green-600 font-medium">Match Rate</p>
                    <p className="text-2xl font-bold text-green-700">94.2%</p>
                    <p className="text-xs text-green-600 mt-1">+3.1% improvement</p>
                  </div>
                  <div className="flex-1 bg-amber-50 rounded-xl p-4 hidden sm:block">
                    <p className="text-xs text-amber-600 font-medium">Exceptions</p>
                    <p className="text-2xl font-bold text-amber-700">23</p>
                    <p className="text-xs text-amber-600 mt-1">8 pending review</p>
                  </div>
                  <div className="flex-1 bg-purple-50 rounded-xl p-4 hidden sm:block">
                    <p className="text-xs text-purple-600 font-medium">AI Confidence</p>
                    <p className="text-2xl font-bold text-purple-700">97.8%</p>
                    <p className="text-xs text-purple-600 mt-1">High accuracy</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Recent Reconciliation Activity</span>
                    <span className="text-xs text-gray-400">Live</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { source: 'Invoice #INV-2847', target: 'Bank Transfer #TXN-9182', status: 'Matched', color: 'green' },
                      { source: 'Invoice #INV-2846', target: 'Stripe Payment #PM-4421', status: 'Matched', color: 'green' },
                      { source: 'Invoice #INV-2845', target: 'Pending Review', status: 'Exception', color: 'amber' },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span className="flex-1 text-gray-700">{row.source}</span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span className="flex-1 text-gray-500">{row.target}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          row.color === 'green' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {row.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">How it Works</h2>
            <p className="mt-3 text-lg text-gray-500">Five simple steps to intelligent reconciliation</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4">
                  <step.icon className="w-7 h-7 text-indigo-600" />
                </div>
                <span className="text-xs font-bold text-indigo-600 mb-1">Step {i + 1}</span>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{step.label}</h3>
                <p className="text-sm text-gray-500">{step.description}</p>
                {i < steps.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute top-7 -right-3 w-5 h-5 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Why ReconcileAI?</h2>
            <p className="mt-3 text-lg text-gray-500">Built for modern finance teams</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {trustBadges.map((badge, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
                  <badge.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <span className="text-sm font-semibold text-gray-900">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to transform your reconciliation process?
          </h2>
          <p className="text-lg text-indigo-200 mb-8">
            Join teams saving hours every week with intelligent automation.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3.5 text-base font-semibold text-indigo-600 bg-white rounded-xl hover:bg-indigo-50 shadow-lg transition-all"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span className="text-sm text-gray-400">
                &copy; 2026 ReconcileAI. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
