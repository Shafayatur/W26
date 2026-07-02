'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import clsx from 'clsx'

interface TriviaQuestion {
    id: string
    question: string
    options: string[]
    correct_index: number
    active_date: string
}

interface TriviaAnswer {
    selected_index: number
    is_correct: boolean
}

export default function TriviaCard({
    question,
    existingAnswer,
    userId,
}: {
    question: TriviaQuestion
    existingAnswer: TriviaAnswer | null
    userId: string
}) {
    const [selected, setSelected] = useState<number | null>(existingAnswer?.selected_index ?? null)
    const [isCorrect, setIsCorrect] = useState<boolean | null>(existingAnswer?.is_correct ?? null)
    const [loading, setLoading] = useState(false)
    const answered = selected !== null

    async function handleAnswer(index: number) {
        if (answered || loading) return
        setLoading(true)

        const correct = index === question.correct_index
        const supabase = createClient()

        await supabase.from('trivia_answers').insert({
            user_id: userId,
            question_id: question.id,
            selected_index: index,
            is_correct: correct,
        })

        if (correct) {
            // Award 1 coin
            await supabase.rpc('award_coins', {
                p_user_id: userId,
                p_amount: 1,
                p_reason: 'trivia_correct',
                p_meta: { question_id: question.id },
            })
        }

        setSelected(index)
        setIsCorrect(correct)
        setLoading(false)
    }

    return (
        <div className="card p-4 space-y-4 border-gold-500/20">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gold-400 uppercase tracking-wider">⚽ Daily Trivia</p>
                {!answered && (
                    <span className="text-xs text-chalk-400 bg-pitch-700/60 px-2 py-0.5 rounded-full">
                        +1 coin if correct
                    </span>
                )}
                {answered && isCorrect && (
                    <span className="text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                        +1 coin earned! 🪙
                    </span>
                )}
                {answered && !isCorrect && (
                    <span className="text-xs text-chalk-400 bg-pitch-700/60 px-2 py-0.5 rounded-full">
                        Better luck tomorrow
                    </span>
                )}
            </div>

            <p className="text-sm font-medium text-chalk-100 leading-snug">{question.question}</p>

            <div className="space-y-2">
                {question.options.map((option, i) => {
                    let style = 'bg-pitch-700/50 border-pitch-600/40 text-chalk-300 hover:border-chalk-400'

                    if (answered) {
                        if (i === question.correct_index) {
                            style = 'bg-green-500/15 border-green-500/40 text-green-400'
                        } else if (i === selected && !isCorrect) {
                            style = 'bg-red-500/15 border-red-500/40 text-red-400'
                        } else {
                            style = 'bg-pitch-700/30 border-pitch-600/20 text-chalk-500'
                        }
                    }

                    return (
                        <button
                            key={i}
                            onClick={() => handleAnswer(i)}
                            disabled={answered || loading}
                            className={clsx(
                                'w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all',
                                style,
                                !answered && 'cursor-pointer',
                                answered && 'cursor-default'
                            )}
                        >
                            <span className="text-chalk-500 mr-2">{['A', 'B', 'C', 'D'][i]}.</span>
                            {option}
                            {answered && i === question.correct_index && ' ✓'}
                            {answered && i === selected && !isCorrect && ' ✗'}
                        </button>
                    )
                })}
            </div>

            {answered && (
                <p className="text-xs text-chalk-400 text-center">
                    {isCorrect
                        ? '🎉 Correct! Come back tomorrow for a new question.'
                        : `The correct answer was: ${question.options[question.correct_index]}`}
                </p>
            )}
        </div>
    )
}