import { cn } from '@/lib/utils';
import type { ActorId } from '../viz/oauthFlows';
import { ACTORS } from '../viz/oauthFlows';

interface StepPlayerProps {
  stepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPlayPause: () => void;
  onReset: () => void;
}

export function StepPlayer({
  stepIndex,
  totalSteps,
  isPlaying,
  onPrev,
  onNext,
  onPlayPause,
  onReset,
}: StepPlayerProps) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onReset}
          className="px-2.5 py-1.5 text-xs rounded-md border border-border text-text-secondary hover:text-text hover:border-text-secondary transition-colors"
          aria-label="Reset"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onPrev}
          disabled={stepIndex === 0}
          className="px-2.5 py-1.5 text-xs rounded-md border border-border disabled:opacity-40 hover:border-text-secondary transition-colors"
          aria-label="Previous step"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={onPlayPause}
          className="px-3 py-1.5 text-xs rounded-md bg-text text-bg font-medium hover:opacity-90 transition-opacity"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={stepIndex >= totalSteps - 1}
          className="px-2.5 py-1.5 text-xs rounded-md border border-border disabled:opacity-40 hover:border-text-secondary transition-colors"
          aria-label="Next step"
        >
          Next
        </button>
      </div>
      <span className="text-xs text-text-secondary tabular-nums">
        Step {stepIndex + 1} / {totalSteps}
      </span>
    </div>
  );
}

interface ActorLaneProps {
  actorId: ActorId;
  isActive: boolean;
}

export function ActorLane({ actorId, isActive }: ActorLaneProps) {
  const actor = ACTORS[actorId];
  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      <div
        className={cn(
          'px-2 py-1 rounded text-[11px] font-medium text-white truncate max-w-full transition-opacity',
          actor.colorClass,
          isActive ? 'opacity-100' : 'opacity-50'
        )}
      >
        {actor.shortLabel}
      </div>
      <div
        className={cn(
          'w-px flex-1 min-h-[120px] mt-2 transition-opacity',
          actor.colorClass,
          isActive ? 'opacity-80' : 'opacity-25'
        )}
      />
    </div>
  );
}

interface SequenceArrowProps {
  from: ActorId;
  to: ActorId;
  message: string;
  channel: 'front' | 'back' | 'internal';
  isActive: boolean;
  isPast: boolean;
  actorOrder: ActorId[];
}

function laneIndex(id: ActorId, order: ActorId[]) {
  return order.indexOf(id);
}

export function SequenceArrow({
  from,
  to,
  message,
  channel,
  isActive,
  isPast,
  actorOrder,
}: SequenceArrowProps) {
  const fromIdx = laneIndex(from, actorOrder);
  const toIdx = laneIndex(to, actorOrder);
  const isSelf = from === to;

  const leftPct = isSelf
    ? ((fromIdx + 0.5) / actorOrder.length) * 100
    : (Math.min(fromIdx, toIdx) / actorOrder.length) * 100 + (100 / actorOrder.length) * 0.1;
  const widthPct = isSelf
    ? (100 / actorOrder.length) * 0.6
    : (Math.abs(toIdx - fromIdx) / actorOrder.length) * 100 * 0.8;

  return (
    <div
      className={cn(
        'relative h-10 flex items-center transition-opacity',
        isActive ? 'opacity-100' : isPast ? 'opacity-40' : 'opacity-15'
      )}
      style={{ marginLeft: `${leftPct}%`, width: `${widthPct}%` }}
    >
      {!isSelf && (
        <div
          className={cn(
            'absolute inset-x-0 top-1/2 h-px -translate-y-1/2',
            channel === 'back' ? 'border-t border-dashed border-text-secondary' : 'bg-text-secondary/60'
          )}
        />
      )}
      {isSelf && (
        <div className="absolute left-0 top-1/2 w-full h-6 border border-text-secondary/40 rounded-r-full border-l-0 -translate-y-1/2" />
      )}
      <span
        className={cn(
          'relative z-10 px-1.5 py-0.5 text-[10px] leading-tight rounded bg-bg border border-border truncate max-w-full',
          isActive && 'border-text-secondary font-medium'
        )}
      >
        {channel === 'back' && 'server: '}
        {channel === 'internal' && 'inside app: '}
        {message}
      </span>
    </div>
  );
}

interface SequenceDiagramProps {
  actorOrder: ActorId[];
  activeActors: Set<ActorId>;
  children: React.ReactNode;
}

export function SequenceDiagram({ actorOrder, activeActors, children }: SequenceDiagramProps) {
  return (
    <div className="rounded-lg border border-border bg-bg-secondary/50 overflow-hidden">
      <div className="flex px-4 pt-4 gap-1">
        {actorOrder.map((id) => (
          <ActorLane key={id} actorId={id} isActive={activeActors.has(id)} />
        ))}
      </div>
      <div className="px-4 pb-4 space-y-1">{children}</div>
      <div className="px-4 py-2 border-t border-border flex gap-4 text-[10px] text-text-secondary">
        <span>solid line = browser</span>
        <span>dashed line = server to server</span>
      </div>
    </div>
  );
}
