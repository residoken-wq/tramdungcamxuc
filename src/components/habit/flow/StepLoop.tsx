'use client'

import React from 'react'
import { vi } from '@/lib/i18n/vi'
import { HABIT_STAGES, type HabitChosenTechnique, type PublicTechnique } from '@/lib/habit'
import type { HabitStage } from '@/lib/diagnostic'

export interface StepLoopProps {
  techniques: PublicTechnique[]
  chosenTechniques: Record<HabitStage, HabitChosenTechnique[]>
  onToggleTechnique: (stage: HabitStage, techId: number, defaultName: string) => void
  onUpdateTechniqueAction: (stage: HabitStage, techId: number, action: string) => void
}

export function StepLoop({
  techniques,
  chosenTechniques,
  onToggleTechnique,
  onUpdateTechniqueAction,
}: StepLoopProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="font-display text-xl sm:text-2xl text-deep-navy mb-1">
          {vi.habit.wizard.step3.title}
        </h2>
        <p className="text-sm sm:text-base text-deep-navy/80">{vi.habit.wizard.step3.subtitle}</p>
        <p className="text-xs text-bright-magenta font-medium mt-1">
          {vi.habit.wizard.step3.maxSelectionNotice}
        </p>
      </div>

      {/* 4 Giai đoạn */}
      {HABIT_STAGES.map((stage) => {
        const stageInfo = vi.habit.wizard.step3.stages[stage]
        const stageTechniques = techniques.filter((t) => t.stage === stage)
        const currentChosen = chosenTechniques[stage] || []

        return (
          <div
            key={stage}
            className="p-5 rounded-card bg-warm-ivory border border-lavender-mist space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h3 className="font-semibold text-deep-navy text-base">{stageInfo.title}</h3>
                <span className="text-xs text-bright-magenta font-medium block">
                  {stageInfo.rule}
                </span>
              </div>
              <span className="text-xs font-semibold text-deep-navy/70">
                {vi.habit.wizard.step3.selectedCount(currentChosen.length)}
              </span>
            </div>
            <p className="text-xs text-deep-navy/70">{stageInfo.desc}</p>

            {/* Danh sách kỹ thuật thuộc giai đoạn */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {stageTechniques.length === 0 ? (
                <p className="col-span-full py-4 text-center text-xs text-deep-navy/60 italic">
                  {vi.habit.wizard.step3.emptyTechniquesList}
                </p>
              ) : (
                stageTechniques.map((tech) => {
                  const isSelected = currentChosen.some((item) => item.techniqueId === tech.id)
                  const chosenItem = currentChosen.find((item) => item.techniqueId === tech.id)

                  return (
                    <div
                      key={tech.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-white border-bright-magenta ring-1 ring-bright-magenta shadow-soft'
                          : 'bg-white/80 border-lavender-mist hover:border-accent-pink/50'
                      }`}
                    >
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleTechnique(stage, tech.id, tech.name)}
                          className="mt-1 w-4 h-4 rounded text-bright-magenta focus:ring-bright-magenta"
                        />
                        <span className="text-sm font-medium text-deep-navy">{tech.name}</span>
                      </label>

                      {/* Ô nhập hành động cụ thể nếu được chọn */}
                      {isSelected && chosenItem && (
                        <div className="mt-3 pt-2.5 border-t border-lavender-mist/50">
                          <label className="block text-xs font-semibold text-deep-navy mb-1">
                            {vi.habit.wizard.step3.actionPrompt}
                          </label>
                          <input
                            type="text"
                            value={chosenItem.action}
                            onChange={(e) =>
                              onUpdateTechniqueAction(stage, tech.id, e.target.value)
                            }
                            placeholder={vi.habit.wizard.step3.actionPlaceholder}
                            className="w-full px-3 py-1.5 text-xs rounded border border-lavender-mist text-deep-navy bg-white focus:outline-none focus:ring-1 focus:ring-bright-magenta"
                          />
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

