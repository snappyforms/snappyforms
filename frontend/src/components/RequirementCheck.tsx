'use client';
import { UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from "next/link";
import { useState } from "react";
import { useAuth } from '@/AuthContext';

type Answer = { id: string; a: string };

type Question = {
    id: number;
    prompt: string | null;
    question: string;
    answers?: Answer[];
    link: string | null;
    keyword: string | null;
};

export default function RequirementCheck() {

    const { formID, setFormID, activePage, setActivePage } = useAuth();
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const questions: Question[] = [
        { id: 1, prompt: null, question: 'Some SNAP beneficiaries do not have to complete work hour requirements. Do you meet any work hour requirement exemptions?', answers: [{ id: '1a', a: `I've never heard of any exemptions.` }, { id: '1b', a: `No, I still need work hours.` }, { id: '1c', a: `Yes, and I am exempt from work hour requirements!` }], link: null, keyword: null },
        { id: 2, prompt: '1c', question: `Great! Confirm with your benefits officer (CAO) that your exemptions are filed with the state to continue your benefits.`, link: null, keyword: 'here' },
        { id: 3, prompt: '1a', question: `Got it! Take these exemptions to your CAO or volunteer organization. They can help you understand if any exemptions apply to you.`, link: null, keyword: 'these' },
        { id: 4, prompt: '1b', question: `Understood! Are you searching for qualifying work hour opportunities?`, answers: [{ id: '4a', a: `Yes, I need more opportunities!` }, { id: '4b', a: `No, I have enough opportunities.` }], link: null, keyword: null },
        { id: 5, prompt: '4a', question: `We're here to help! Browse our list of qualifying work hour opportunities here.`, link: null, keyword: 'here' },
        { id: 6, prompt: '4b', question: 'Amazing! Log your completed hours in the Activity Log.', link: null, keyword: 'Activity Log' }

    ];

    const questionPath: Question[] = [];
    const visitedQuestions = new Set<number>();
    let currentQuestion = questions.find((question) => question.prompt === null);

    while (currentQuestion && !visitedQuestions.has(currentQuestion.id)) {
        questionPath.push(currentQuestion);
        visitedQuestions.add(currentQuestion.id);

        const selectedAnswerId = selectedAnswers[currentQuestion.id];
        if (!selectedAnswerId) break;

        currentQuestion = questions.find((question) => question.prompt === selectedAnswerId);
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="grid grid-cols-3 items-end">
                <Link href="/newForm" className="text-sm text-muted-foreground">
                    ← Back
                </Link>

                <h1 className="mt-4 text-2xl font-bold">SnappyForms</h1>
                <span className='justify-self-end'><UserCircle /></span>
            </div>

            {/* Questionnaire */}
            <div className='flex flex-col gap-10 bg-slate-100 p-4 pt-0 rounded-sm border shadow-sm overflow-auto max-h-[80vh]'>
                <h1 className="mt-4 text-lg font-medium">Work Hour Requirement <span className='text-green-700'>Exemptions</span></h1>
                <div className="flex flex-col gap-4">
                    {questionPath.map((question) => (
                        <section key={question.id} className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-sm font-medium leading-6 text-slate-800">{question.question}</p>
                            {question.answers && (
                                <div role="group" aria-label={`Answers for question ${question.id}`} className="flex flex-col gap-2">
                                    {question.answers.map((answer) => {
                                        const isSelected = selectedAnswers[question.id] === answer.id;

                                        return (
                                            <button
                                                key={answer.id}
                                                type="button"
                                                aria-pressed={isSelected}
                                                onClick={() => setSelectedAnswers((previous) => ({
                                                    ...previous,
                                                    [question.id]: answer.id,
                                                }))}
                                                className={`rounded border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${isSelected
                                                    ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                                                    : "border-slate-300 bg-white text-slate-700 hover:border-emerald-600 hover:bg-emerald-50"
                                                    }`}
                                            >
                                                {answer.a}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    ))}
                </div>

            </div>
            <a href="/newForm" className='grid w-full'>
                <Button
                    // disabled={hours == null || cadence == null}
                    className='w-fit justify-self-end'
                    onClick={() => {setActivePage(activePage+1); }}>
                    Save
                </Button>
            </a>

        </div>
    )
}