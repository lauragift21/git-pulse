import { useEffect, useRef, useState } from "react";
import {
  Github,
  ArrowRight,
  Activity,
  GitPullRequest,
  BarChart3,
  Users,
  Zap,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDarkMode } from "@/hooks/useDarkMode";

interface LandingPageProps {
  onGetStarted: () => void;
}

/** Intersection Observer hook for scroll-triggered animations */
function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.unobserve(el);
      }
    }, options);

    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isInView };
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const { isDark } = useDarkMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger entrance animations after mount
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-bg-secondary overflow-hidden">
      {/* Navigation */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
      >
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-text-primary flex items-center justify-center">
              <Activity className="w-4 h-4 text-text-inverse" />
            </div>
            <span className="text-lg font-bold text-text-primary tracking-tight">
              GitPulse
            </span>
          </div>
          <Button variant="primary" size="md" onClick={onGetStarted}>
            Get Started
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6">
        {/* Animated background grid */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className={`absolute inset-0 transition-opacity duration-1000 ${mounted ? "opacity-100" : "opacity-0"}`}
          >
            {/* Grid pattern */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: isDark
                  ? "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)"
                  : "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
                backgroundSize: "64px 64px",
              }}
            />
            {/* Radial fade on grid */}
            <div
              className="absolute inset-0"
              style={{
                background: isDark
                  ? "radial-gradient(ellipse 60% 50% at 50% 30%, transparent 0%, #000000 70%)"
                  : "radial-gradient(ellipse 60% 50% at 50% 30%, transparent 0%, #fafafa 70%)",
              }}
            />
          </div>

          {/* Floating orbs */}
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-text-primary/5 rounded-full blur-3xl landing-float" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-text-primary/3 rounded-full blur-3xl landing-float-delayed" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 rounded-full border border-border-primary bg-bg-card px-4 py-1.5 mb-8 transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-text-primary/40 landing-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-text-primary" />
            </span>
            <span className="text-xs font-medium text-text-secondary tracking-wide">
              Powered by TanStack DB
            </span>
          </div>

          {/* Main headline */}
          <h1
            className={`text-5xl sm:text-7xl font-bold text-text-primary tracking-tight leading-[1.05] mb-6 transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            Your GitHub activity,
            <br />
            <span className="relative inline-block">
              in real time
              <svg
                className={`absolute -bottom-2 left-0 w-full transition-all duration-1000 delay-1000 ${mounted ? "opacity-100" : "opacity-0"}`}
                viewBox="0 0 300 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 8C50 2 100 2 150 6C200 10 250 4 298 6"
                  className="stroke-text-primary/20"
                  strokeWidth="3"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 400,
                    strokeDashoffset: mounted ? 0 : 400,
                    transition: "stroke-dashoffset 1.5s ease-out 1s",
                  }}
                />
              </svg>
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className={`text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-700 delay-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            Track repositories, pull requests, issues, and contributions across
            your entire GitHub workflow. Live dashboards that update the moment
            something changes.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex items-center justify-center gap-4 mb-16 transition-all duration-700 delay-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <Button
              variant="primary"
              size="lg"
              className="px-8 py-3 text-base"
              onClick={onGetStarted}
            >
              <Github className="w-5 h-5" />
              Connect GitHub
            </Button>
            <a
              href="#features"
              className="inline-flex items-center gap-1.5 px-5 py-3 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-150"
            >
              Learn more
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Hero mockup / preview card */}
          <div
            className={`relative max-w-3xl mx-auto transition-all duration-1000 delay-700 ${mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-12 scale-95"}`}
          >
            <div className="rounded-2xl border border-border-primary bg-bg-card p-1.5 shadow-2xl shadow-black/5 dark:shadow-black/30">
              <div className="rounded-xl border border-border-secondary bg-bg-primary overflow-hidden">
                {/* Window chrome */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border-secondary">
                  <div className="w-2.5 h-2.5 rounded-full bg-text-tertiary/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-text-tertiary/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-text-tertiary/40" />
                  <div className="flex-1 flex justify-center">
                    <div className="px-3 py-0.5 rounded-md bg-bg-tertiary text-xs text-text-tertiary font-mono">
                      gitpulse.dev
                    </div>
                  </div>
                </div>

                {/* Mock dashboard content */}
                <div className="p-6 space-y-4">
                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Repositories", value: "12" },
                      { label: "Open PRs", value: "23" },
                      { label: "Issues", value: "47" },
                      { label: "Contributors", value: "8" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-lg border border-border-secondary bg-bg-secondary p-3"
                      >
                        <p className="text-xs text-text-tertiary mb-1">
                          {stat.label}
                        </p>
                        <p className="text-xl font-bold text-text-primary font-mono">
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Activity graph mock */}
                  <div className="rounded-lg border border-border-secondary bg-bg-secondary p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-medium text-text-secondary">
                        Activity
                      </span>
                      <span className="text-xs text-text-tertiary">
                        Last 7 days
                      </span>
                    </div>
                    <div className="flex items-end gap-1.5 h-20">
                      {[35, 52, 28, 65, 43, 78, 55, 40, 68, 45, 82, 60].map(
                        (h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-sm bg-text-primary/10 landing-bar-grow"
                            style={{
                              height: `${h}%`,
                              animationDelay: `${1.2 + i * 0.08}s`,
                            }}
                          />
                        ),
                      )}
                    </div>
                  </div>

                  {/* Recent items mock */}
                  <div className="space-y-2">
                    {[
                      {
                        icon: GitPullRequest,
                        text: "feat: add real-time sync",
                        badge: "merged",
                      },
                      {
                        icon: Activity,
                        text: "fix: resolve race condition",
                        badge: "open",
                      },
                      {
                        icon: GitPullRequest,
                        text: "refactor: optimize queries",
                        badge: "review",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-lg border border-border-secondary bg-bg-secondary p-3 landing-fade-in-up"
                        style={{ animationDelay: `${1.5 + i * 0.15}s` }}
                      >
                        <item.icon className="w-4 h-4 text-text-tertiary shrink-0" />
                        <span className="text-sm text-text-primary font-mono flex-1 truncate">
                          {item.text}
                        </span>
                        <span className="text-xs text-text-tertiary px-2 py-0.5 rounded-full border border-border-secondary">
                          {item.badge}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Glow effect behind the card */}
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-text-primary/5 blur-2xl landing-pulse-slow" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            label="Features"
            title="Everything you need to stay on top of your code"
            description="GitPulse gives you a bird's-eye view of your GitHub activity with live-updating data, so you never miss a beat."
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-16">
            <FeatureCard
              icon={Eye}
              title="Live Dashboards"
              description="Real-time stats and charts that update instantly as activity happens across your tracked repositories."
              delay={0}
            />
            <FeatureCard
              icon={GitPullRequest}
              title="PR Kanban Board"
              description="Visualize pull requests as a kanban board. Drag and drop between stages, see review status at a glance."
              delay={100}
            />
            <FeatureCard
              icon={Activity}
              title="Activity Timeline"
              description="A chronological feed of every push, PR, issue, and review across all your tracked repos."
              delay={200}
            />
            <FeatureCard
              icon={BarChart3}
              title="Contribution Analytics"
              description="Leaderboards, commit charts, and review metrics. See who's contributing what and when."
              delay={300}
            />
            <FeatureCard
              icon={Zap}
              title="Optimistic Updates"
              description="Instant UI feedback on every action. Star a repo, close an issue -- the UI updates before the API responds."
              delay={400}
            />
            <FeatureCard
              icon={Users}
              title="Team Overview"
              description="Track contributors across repositories. See activity patterns, review loads, and collaboration graphs."
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <SectionHeader
            label="How It Works"
            title="Three steps to full visibility"
            description="Get started in under a minute. No installations, no configuration files."
          />

          <div className="mt-16 space-y-6">
            <StepRow
              step={1}
              title="Connect your GitHub account"
              description="Sign in with GitHub OAuth. We only request read access to your public and private repositories."
              delay={0}
            />
            <StepRow
              step={2}
              title="Pick repositories to track"
              description="Search and select the repos you care about. Track as many as you want -- we handle the rest."
              delay={150}
            />
            <StepRow
              step={3}
              title="Watch your dashboard come alive"
              description="Real-time data flows in immediately. PRs, issues, events, and contributor stats -- all live."
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-primary py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-text-primary flex items-center justify-center">
              <Activity className="w-3 h-3 text-text-inverse" />
            </div>
            <span className="text-sm font-semibold text-text-primary">
              GitPulse
            </span>
          </div>
          <p className="text-xs text-text-tertiary">
            Built with TanStack DB &middot; Deployed on Cloudflare
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────── */

function SectionHeader({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  const { ref, isInView } = useInView({ threshold: 0.3 });

  return (
    <div ref={ref} className="text-center">
      <span
        className={`inline-block text-xs font-medium text-text-tertiary uppercase tracking-widest mb-4 transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        {label}
      </span>
      <h2
        className={`text-3xl sm:text-4xl font-bold text-text-primary tracking-tight mb-4 transition-all duration-700 delay-100 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        {title}
      </h2>
      <p
        className={`text-text-secondary max-w-xl mx-auto leading-relaxed transition-all duration-700 delay-200 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        {description}
      </p>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  delay: number;
}) {
  const { ref, isInView } = useInView({ threshold: 0.2 });

  return (
    <div
      ref={ref}
      className={`group rounded-xl border border-border-primary bg-bg-card p-6 transition-all duration-700 hover:border-text-primary/20 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="w-10 h-10 rounded-lg bg-bg-tertiary border border-border-secondary flex items-center justify-center mb-4 group-hover:bg-text-primary group-hover:border-text-primary transition-colors duration-300">
        <Icon className="w-5 h-5 text-text-primary group-hover:text-text-inverse transition-colors duration-300" />
      </div>
      <h3 className="text-sm font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function StepRow({
  step,
  title,
  description,
  delay,
}: {
  step: number;
  title: string;
  description: string;
  delay: number;
}) {
  const { ref, isInView } = useInView({ threshold: 0.3 });

  return (
    <div
      ref={ref}
      className={`flex items-start gap-5 rounded-xl border border-border-primary bg-bg-card p-6 transition-all duration-700 ${isInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <span className="flex items-center justify-center shrink-0 w-10 h-10 rounded-full border-2 border-text-primary text-text-primary text-sm font-bold">
        {step}
      </span>
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">
          {title}
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
