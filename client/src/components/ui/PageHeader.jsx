import React from 'react';
import { Plus } from 'lucide-react';

export default function PageHeader({
  icon: Icon,
  title,
  subtitle,
  description,
  children,
  actionLabel,
  onAction,
  actionIcon: ActionIcon = Plus,
  actions,
  badgeText,
}) {
  const displaySubtitle = subtitle || description;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-white px-5 py-3.5 border border-slate-200 shadow-2xs">
      {/* Left: Icon Badge & Title / Subtitle */}
      <div className="flex items-center gap-3.5">
        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs">
            <Icon className="h-5 w-5 stroke-[2.2]" />
          </div>
        )}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-900 leading-tight">
              {title}
            </h2>
            {badgeText && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200">
                {badgeText}
              </span>
            )}
          </div>
          {displaySubtitle && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
              {displaySubtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Custom Filters & Action Button */}
      <div className="flex flex-wrap items-center gap-3 ml-auto">
        {children}

        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <ActionIcon className="h-4 w-4 stroke-[2.5]" />
            <span>{actionLabel}</span>
          </button>
        )}

        {Array.isArray(actions) &&
          actions.map((act, idx) => {
            const ActIcon = act.icon || Plus;
            return (
              <button
                key={idx}
                type="button"
                onClick={act.onClick}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ActIcon className="h-4 w-4 stroke-[2.5]" />
                <span>{act.label}</span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
