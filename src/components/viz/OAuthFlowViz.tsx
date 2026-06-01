import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, randomCodeVerifier, sha256Base64Url } from '@/lib/utils';
import { StepPlayer } from '@/components/diagram/SequenceDiagram';
import {
  OAUTH_FLOWS,
  APP_TYPE_GUIDE,
  ACTORS,
  type ActorId,
  type FlowStep,
} from './oauthFlows';

const actorPlainNames: Record<ActorId, string> = {
  user: 'Resource Owner',
  client: 'Client',
  auth: 'Authorization Server',
  resource: 'Resource Server',
};

export function OAuthFlowViz() {
  const [flowId, setFlowId] = useState(OAUTH_FLOWS[0].id);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [clientId, setClientId] = useState('print_express_web');
  const [redirectUri, setRedirectUri] = useState('https://print.example.com/oauth/callback');
  const [scope, setScope] = useState('https://www.googleapis.com/auth/drive.readonly');
  const [codeVerifier, setCodeVerifier] = useState(() => randomCodeVerifier());
  const [codeChallenge, setCodeChallenge] = useState('');

  const flow = OAUTH_FLOWS.find((f) => f.id === flowId) ?? OAUTH_FLOWS[0];
  const step = flow.steps[stepIndex];

  useEffect(() => {
    sha256Base64Url(codeVerifier).then(setCodeChallenge);
  }, [codeVerifier]);

  useEffect(() => {
    setStepIndex(0);
    setIsPlaying(false);
  }, [flowId]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setStepIndex((i) => {
        if (i >= flow.steps.length - 1) {
          setIsPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 2500);
    return () => clearInterval(timer);
  }, [isPlaying, flow.steps.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') setStepIndex((i) => Math.min(i + 1, flow.steps.length - 1));
      if (e.key === 'ArrowLeft') setStepIndex((i) => Math.max(i - 1, 0));
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flow.steps.length]);

  const authorizeUrl = useMemo(() => {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state: 'xyz123',
      code_challenge: codeChallenge || '…',
      code_challenge_method: 'S256',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }, [clientId, redirectUri, scope, codeChallenge]);

  const regenVerifier = useCallback(() => {
    setCodeVerifier(randomCodeVerifier());
  }, []);

  return (
    <div className="not-prose -mx-5 sm:mx-0 my-8 space-y-4">
      <div className="rounded-xl border border-border p-4 bg-bg-secondary/30">
        <p className="text-[11px] uppercase tracking-widest text-text-secondary mb-2">Start here</p>
        <h2 className="text-lg font-semibold tracking-tight mb-2">Authorization Code + PKCE, step by step</h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          JayP wants Print Express to read Google Drive files. Read the picture by following
          the moving credential: password stays at Google, code returns to Print Express,
          token goes to the Drive API.
        </p>
        <VisualTakeaways />
      </div>

      {/* Main viz panel */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-bg-secondary/30">
          <StepPlayer
            stepIndex={stepIndex}
            totalSteps={flow.steps.length}
            isPlaying={isPlaying}
            onPrev={() => setStepIndex((i) => Math.max(0, i - 1))}
            onNext={() => setStepIndex((i) => Math.min(flow.steps.length - 1, i + 1))}
            onPlayPause={() => setIsPlaying((p) => !p)}
            onReset={() => {
              setStepIndex(0);
              setIsPlaying(false);
            }}
          />
        </div>

        <div className="p-4 grid lg:grid-cols-[1fr_280px] gap-4">
          <div className="space-y-3">
            <SystemBoxDiagram
              steps={flow.steps}
              activeStepIndex={stepIndex}
              onStepSelect={(index) => {
                setStepIndex(index);
                setIsPlaying(false);
              }}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={`${flowId}-${stepIndex}`}
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-[11px] uppercase tracking-widest text-text-secondary mb-1">
                  {actorPlainNames[step.from]} to {actorPlainNames[step.to]}
                </p>
                <h3 className="text-base font-semibold mb-1">{step.title}</h3>
                <p className="text-[13px] text-text-secondary leading-relaxed mb-3">{step.description}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="space-y-3">
            <PlainStepCard step={step} />

            <details className="rounded-lg border border-border">
              <summary className="px-3 py-2 text-sm font-medium cursor-pointer hover:bg-bg-secondary/50 transition-colors">
                Show technical details
              </summary>
              <div className="p-3 border-t border-border space-y-3">
                {flowId === 'auth-code-pkce' && (
                  <>
                    <ParamField label="client_id" value={clientId} onChange={setClientId} />
                    <ParamField label="redirect_uri" value={redirectUri} onChange={setRedirectUri} />
                    <ParamField label="scope" value={scope} onChange={setScope} />

                    {stepIndex >= 2 && (
                      <div className="rounded-lg border border-border p-3 bg-bg-secondary/50">
                        <p className="text-[10px] uppercase tracking-widest text-text-secondary mb-2">Authorization request</p>
                        <code className="text-[10px] font-mono break-all leading-relaxed block">{authorizeUrl}</code>
                      </div>
                    )}

                    {step.id === 'pkce-state' && (
                      <PkcePanel
                        codeVerifier={codeVerifier}
                        codeChallenge={codeChallenge}
                        onRegen={regenVerifier}
                        onVerifierChange={setCodeVerifier}
                      />
                    )}
                  </>
                )}

                <RequestResponsePanel step={step} />
              </div>
            </details>
          </div>
        </div>
      </div>

      <details className="rounded-lg border border-border">
        <summary className="px-4 py-3 text-sm font-medium cursor-pointer hover:bg-bg-secondary/50 transition-colors">
          Other OAuth flows
        </summary>
        <div className="p-4 border-t border-border space-y-2">
          <p className="text-sm text-text-secondary leading-relaxed">
            User-facing login usually uses Authorization Code + PKCE. Service-to-service jobs use
            Client Credentials because there is no Resource Owner or User-Agent redirect.
          </p>
          <div className="flex flex-wrap gap-2">
            {OAUTH_FLOWS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFlowId(f.id)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-md border transition-colors',
                  flowId === f.id
                    ? 'border-text bg-text text-bg'
                    : 'border-border text-text-secondary hover:border-text-secondary hover:text-text'
                )}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
      </details>

      <details className="rounded-lg border border-border group">
        <summary className="px-4 py-3 text-sm font-medium cursor-pointer hover:bg-bg-secondary/50 transition-colors">
          Which setup do I have?
        </summary>
        <div className="border-t border-border overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-text-secondary">
                <th className="px-4 py-2 font-medium">App type</th>
                <th className="px-4 py-2 font-medium">Secret?</th>
                <th className="px-4 py-2 font-medium">Flow</th>
                <th className="px-4 py-2 font-medium">Why</th>
              </tr>
            </thead>
            <tbody>
              {APP_TYPE_GUIDE.map((row) => (
                <tr key={row.type} className="border-b border-border last:border-0">
                  <td className="px-4 py-2">{row.type}</td>
                  <td className="px-4 py-2 text-text-secondary">{row.secret}</td>
                  <td className="px-4 py-2 font-mono text-xs">{row.flow}</td>
                  <td className="px-4 py-2 text-text-secondary">{row.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <p className="text-[11px] text-text-secondary">
        Use Next to walk through the story. The advanced details are there when you want them.
      </p>
    </div>
  );
}

function VisualTakeaways() {
  const takeaways = [
    {
      label: 'Password',
      title: 'Stops at Google',
      colorClass: 'bg-actor-auth',
    },
    {
      label: 'Code',
      title: 'Passes through browser',
      colorClass: 'bg-actor-client',
    },
    {
      label: 'Token',
      title: 'Unlocks the API',
      colorClass: 'bg-actor-resource',
    },
  ];

  return (
    <div className="grid sm:grid-cols-3 gap-2 mt-3">
      {takeaways.map((item) => (
        <div key={item.label} className="rounded-lg border border-border bg-bg px-3 py-2">
          <div className="flex items-center gap-2">
            <span className={cn('h-2 w-8 rounded-full', item.colorClass)} />
            <span className="text-[10px] uppercase tracking-widest text-text-secondary">{item.label}</span>
          </div>
          <p className="text-sm font-medium mt-1">{item.title}</p>
        </div>
      ))}
    </div>
  );
}

const visualCueByStep: Record<string, string> = {
  initiate: 'The first arrow is just the user intent: JayP asks Print Express to connect Drive.',
  'pkce-state': 'The green PKCE pill stays inside Print Express; it is not sent as the verifier yet.',
  'authorization-request': 'The browser leaves Print Express and goes to Google with a code challenge, not a password.',
  authenticate: 'The active path touches Google because JayP authenticates there, outside Print Express.',
  consent: 'Consent happens at Google; the requested Drive scope is the thing JayP approves.',
  'authorization-response': 'The yellow code appears on the return trip. It is temporary and not an API credential.',
  'validate-state': 'Print Express checks that the returned state matches the state it created before redirecting.',
  'token-request': 'The dashed path is server-to-server: Print Express exchanges code plus verifier at Google.',
  'token-response': 'The green token is born at Google and returned to Print Express after validation.',
  'resource-request': 'Only now does Print Express call Drive, carrying the Bearer token instead of a password.',
  'resource-response': 'Drive validates the token before returning JayP’s files.',
  refresh: 'Refresh is another server-to-server token exchange; the browser is not involved.',
  'cc-token': 'No user box lights up because Client Credentials is machine-to-machine.',
  'cc-api': 'The service uses its own token to call the API; no delegated user consent appears.',
};

function PlainStepCard({ step }: { step: FlowStep }) {
  const channelCopy = {
    front: 'Front-channel: the User-Agent is redirected through the browser.',
    back: 'Back-channel: direct HTTP between client/server components.',
    internal: 'Internal client step: no OAuth message leaves the client.',
  }[step.channel];

  return (
    <div className="rounded-lg border border-border p-3 bg-bg-secondary/40">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary mb-2">Plain English</p>
      <p className="text-sm leading-relaxed">
        <span className="font-medium">{actorPlainNames[step.from]}</span>
        {' communicates with '}
        <span className="font-medium">{actorPlainNames[step.to]}</span>.
      </p>
      <p className="text-sm leading-relaxed mt-2">{visualCueByStep[step.id] ?? 'Follow the active arrow and the highlighted boxes.'}</p>
      <p className="text-xs text-text-secondary mt-2">{channelCopy}</p>
    </div>
  );
}

function SystemBoxDiagram({
  steps,
  activeStepIndex,
  onStepSelect,
}: {
  steps: FlowStep[];
  activeStepIndex: number;
  onStepSelect: (index: number) => void;
}) {
  const visibleStepIndex = Math.max(activeStepIndex, 0);
  const activeStep = steps[activeStepIndex];
  const stepReached = (id: string) => steps.findIndex((step) => step.id === id) <= visibleStepIndex;
  const tokenState =
    activeStep?.id === 'resource-request' || activeStep?.id === 'resource-response' || activeStep?.id === 'refresh'
      ? 'api'
      : activeStep?.id === 'token-response'
        ? 'token'
        : activeStep?.id === 'authorization-response' || activeStep?.id === 'validate-state' || activeStep?.id === 'token-request'
          ? 'code'
          : 'hidden';

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-[#0b1020] text-white">
      <div className="px-4 py-3 border-b border-white/10">
        <p className="text-[11px] uppercase tracking-widest text-white/45">Interactive scene</p>
        <p className="text-sm text-white/70 mt-1">
          Click a step. Watch the authorization code become an access token, then unlock the API.
        </p>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox="0 0 760 420" className="min-w-[640px] w-full h-auto">
          <defs>
            <marker
              id="manim-arrow"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M 0 0 L 8 4 L 0 8 z" fill="#e5e7eb" />
            </marker>
            <filter id="soft-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect x="0" y="0" width="760" height="420" fill="#0b1020" />
          <circle cx="640" cy="60" r="110" fill="#1e293b" opacity="0.28" />
          <circle cx="120" cy="330" r="120" fill="#111827" opacity="0.55" />

          <ManimNode
            x={70}
            y={165}
            label="JayP"
            sublabel="Resource Owner"
            color="#60a5fa"
            active={activeStep?.from === 'user' || activeStep?.to === 'user'}
          />
          <ManimNode
            x={285}
            y={165}
            label="Print Express"
            sublabel="OAuth Client"
            color="#34d399"
            active={activeStep?.from === 'client' || activeStep?.to === 'client'}
          />
          <ManimNode
            x={525}
            y={88}
            label="Google Accounts"
            sublabel="Authorization Server"
            color="#f87171"
            active={activeStep?.from === 'auth' || activeStep?.to === 'auth'}
          />
          <ManimNode
            x={535}
            y={285}
            label="Google Drive"
            sublabel="Resource Server"
            color="#c084fc"
            active={activeStep?.from === 'resource' || activeStep?.to === 'resource'}
          />

          <AnimatedArrow
            show={stepReached('initiate')}
            active={activeStep?.id === 'initiate'}
            path="M 220 200 C 246 196, 260 194, 285 198"
            label="click Connect"
            labelX={252}
            labelY={184}
          />
          <AnimatedArrow
            show={stepReached('authorization-request')}
            active={activeStep?.id === 'authorization-request'}
            path="M 430 180 C 470 142, 500 130, 535 130"
            label="/authorize request"
            labelX={445}
            labelY={122}
          />
          <AnimatedArrow
            show={stepReached('authenticate')}
            active={activeStep?.id === 'authenticate' || activeStep?.id === 'consent'}
            path="M 155 165 C 270 62, 458 42, 548 102"
            label="login + consent"
            labelX={275}
            labelY={64}
          />
          <AnimatedArrow
            show={stepReached('authorization-response')}
            active={activeStep?.id === 'authorization-response'}
            path="M 545 175 C 495 232, 465 252, 420 218"
            label="authorization code + state"
            labelX={488}
            labelY={250}
          />
          <AnimatedArrow
            show={stepReached('token-request')}
            active={activeStep?.id === 'token-request'}
            path="M 430 220 C 488 265, 520 238, 545 178"
            label="/token exchange"
            labelX={500}
            labelY={286}
            dashed
          />
          <AnimatedArrow
            show={stepReached('resource-request')}
            active={activeStep?.id === 'resource-request' || activeStep?.id === 'resource-response'}
            path="M 420 235 C 482 308, 492 330, 545 330"
            label="Bearer access_token"
            labelX={425}
            labelY={330}
            dashed
          />

          {stepReached('pkce-state') && (
            <motion.g
              initial={false}
              animate={{ opacity: 1, scale: activeStep?.id === 'pkce-state' ? 1.08 : 1 }}
              transition={{ duration: 0.35 }}
            >
              <rect x="288" y="258" width="150" height="48" rx="24" fill="#111827" stroke="#34d399" strokeWidth="2" />
              <text x="363" y="278" textAnchor="middle" fontSize="12" fill="#86efac" fontFamily="ui-monospace, monospace">
                state + PKCE
              </text>
              <text x="363" y="294" textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="ui-monospace, monospace">
                verifier stays here
              </text>
            </motion.g>
          )}

          {tokenState !== 'hidden' && (
            <motion.g
              initial={false}
              animate={tokenPosition[tokenState]}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            >
              <rect width="98" height="34" rx="17" fill={tokenState === 'code' ? '#facc15' : '#22c55e'} filter="url(#soft-glow)" />
              <text x="49" y="22" textAnchor="middle" fontSize="14" fill="#0b1020" fontWeight="700" fontFamily="ui-monospace, monospace">
                {tokenState === 'code' ? 'code' : 'token'}
              </text>
            </motion.g>
          )}

          <AnimatePresence mode="wait">
            <motion.g
              key={activeStep?.id}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
            >
              <text x="56" y="374" fill="#e5e7eb" fontSize="20" fontWeight="700">
                {activeStepIndex + 1}. {activeStep?.title}
              </text>
              <text x="56" y="400" fill="#94a3b8" fontSize="13">
                JayP's password stays at Google. Print Express handles authorization codes and tokens.
              </text>
            </motion.g>
          </AnimatePresence>
        </svg>
      </div>

      <div className="grid sm:grid-cols-2 gap-2 p-3 border-t border-white/10 bg-black/15">
        {steps.map((s, index) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onStepSelect(index)}
            className={cn(
              'text-left rounded-md border px-3 py-2 transition-colors',
              index === activeStepIndex
                ? 'border-white/70 bg-white/10 text-white'
                : index < activeStepIndex
                  ? 'border-white/15 bg-white/[0.04] text-white/65 hover:text-white'
                  : 'border-white/10 text-white/45 hover:border-white/30 hover:text-white/80'
            )}
            aria-current={index === activeStepIndex ? 'step' : undefined}
          >
            <span className="text-[11px] font-mono mr-2">{index + 1}</span>
            <span className="text-xs">{s.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const tokenPosition = {
  code: { x: 486, y: 214 },
  token: { x: 475, y: 250 },
  api: { x: 500, y: 310 },
};

function ManimNode({
  x,
  y,
  label,
  sublabel,
  color,
  active,
}: {
  x: number;
  y: number;
  label: string;
  sublabel: string;
  color: string;
  active: boolean;
}) {
  return (
    <motion.g
      initial={false}
      animate={{ opacity: active ? 1 : 0.62, scale: active ? 1.04 : 1 }}
      transition={{ duration: 0.25 }}
    >
      <rect
        x={x}
        y={y}
        width="150"
        height="72"
        rx="18"
        fill="#0f172a"
        stroke={color}
        strokeWidth={active ? 3 : 1.6}
      />
      <text x={x + 75} y={y + 32} textAnchor="middle" fill="#f8fafc" fontSize="16" fontWeight="700">
        {label}
      </text>
      <text x={x + 75} y={y + 52} textAnchor="middle" fill="#94a3b8" fontSize="12">
        {sublabel}
      </text>
    </motion.g>
  );
}

function AnimatedArrow({
  show,
  active,
  path,
  label,
  labelX,
  labelY,
  dashed = false,
}: {
  show: boolean;
  active: boolean;
  path: string;
  label: string;
  labelX: number;
  labelY: number;
  dashed?: boolean;
}) {
  if (!show) return null;

  return (
    <motion.g initial={false} animate={{ opacity: active ? 1 : 0.55 }} transition={{ duration: 0.2 }}>
      <motion.path
        key={`${label}-${active ? 'active' : 'seen'}`}
        d={path}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={active ? 3 : 1.8}
        strokeDasharray={dashed ? '8 8' : undefined}
        markerEnd="url(#manim-arrow)"
        initial={false}
        animate={{
          pathLength: active ? [0, 1] : 1,
        }}
        transition={{ duration: active ? 0.75 : 0.35, ease: 'easeInOut' }}
      />
      {active && (
        <motion.path
          d={path}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="10 18"
          initial={{ strokeDashoffset: 0, opacity: 0.9 }}
          animate={{ strokeDashoffset: -84, opacity: [0.25, 0.95, 0.25] }}
          transition={{
            strokeDashoffset: { duration: 1.1, repeat: Infinity, ease: 'linear' },
            opacity: { duration: 1.1, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
      )}
      <motion.text
        x={labelX}
        y={labelY}
        textAnchor="middle"
        fill={active ? '#f8fafc' : '#94a3b8'}
        fontSize="12"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.25 }}
      >
        {label}
      </motion.text>
    </motion.g>
  );
}

function ParamField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-text-secondary">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-2.5 py-1.5 text-xs font-mono rounded-md border border-border bg-bg focus:border-text-secondary outline-none"
      />
    </label>
  );
}

function PkcePanel({
  codeVerifier,
  codeChallenge,
  onRegen,
  onVerifierChange,
}: {
  codeVerifier: string;
  codeChallenge: string;
  onRegen: () => void;
  onVerifierChange: (v: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border p-3 bg-bg-secondary/50 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">PKCE (live SHA-256)</p>
        <button
          type="button"
          onClick={onRegen}
          className="text-[10px] text-text-secondary hover:text-text underline"
        >
          Regen
        </button>
      </div>
      <label className="block">
        <span className="text-[10px] text-text-secondary">code_verifier</span>
        <textarea
          value={codeVerifier}
          onChange={(e) => onVerifierChange(e.target.value)}
          rows={2}
          className="mt-0.5 w-full px-2 py-1 text-[10px] font-mono rounded border border-border bg-bg resize-none"
        />
      </label>
      <div>
        <span className="text-[10px] text-text-secondary">↓ BASE64URL(SHA-256(verifier))</span>
        <code className="block mt-0.5 text-[10px] font-mono break-all">{codeChallenge || '…'}</code>
      </div>
    </div>
  );
}

function RequestResponsePanel({ step }: { step: FlowStep }) {
  if (!step.request && !step.response) return null;
  return (
    <div className="space-y-2">
      {step.request && (
        <CodeBlock label="Request" content={step.request} color={ACTORS[step.from].colorClass} />
      )}
      {step.response && (
        <CodeBlock label="Response" content={step.response} color={ACTORS[step.to].colorClass} />
      )}
    </div>
  );
}

function CodeBlock({ label, content, color }: { label: string; content: string; color: string }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className={cn('px-2.5 py-1 text-[10px] font-medium text-white', color)}>{label}</div>
      <pre className="!border-0 !rounded-none !m-0 !text-[10px] !py-2 !px-2.5">{content}</pre>
    </div>
  );
}
