import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { act, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { User, UserCircle, Circle, CircleCheck } from 'lucide-react';
import { Reminders } from '../demo/data/reminders';
import { Statistics } from '../demo/data/statistics';

export default function BeneHome() {
    const actionInfo = {
        newForm: { key: 'new', label: 'Start New Form', href: '/newForm' },
        documents: { key: 'docs', label: 'My Documents', href: '' },
        resources: { key: 'resources', label: 'Resource Center', href: '' },
        settings: { key: 'settings', label: 'Settings', href: '' }
    } as const;

    const actions = Object.keys(actionInfo) as Array<keyof typeof actionInfo>;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="grid grid-cols-2 items-end">
                <h1 className="mt-4 text-2xl font-bold">SnappyForms</h1>
                <span className='justify-self-end'><UserCircle /></span>
            </div>

            {/* Reminders and upcoming */}
            <div className='flex flex-col gap-2 bg-white p-4 rounded-sm border shadow-sm'>
                <label className="text-sm font-medium">Reminders & Notifications</label>
                <div className='flex flex-col gap-2 max-h-[15vh] overflow-auto'>
                    {
                        Reminders.map((alert) => (
                            <div className='flex flex-col'>
                                <span className="mt-1 text-sm text-muted-foreground text-slate-600 font-medium flex items-center gap-2">
                                    <div className='rounded-xl w-[10px] h-[10px] bg-yellow-400 shadow-md border-yellow-700 '></div>
                                    {alert.header}
                                </span>
                                <span className='mt-1 text-sm text-muted-foreground text-slate-500'>{alert.body}</span>
                            </div>
                        ))
                    }
                </div>
            </div>

            <div className='grid grid-cols-[1fr_3fr] gap-6 max-h-[50vh] '>
                <div className='flex flex-col gap-5'>
                    {/* Action Buttons - New form, My Documents, Resource Center, Settings */}
                    <section aria-labelledby="actions-heading" className="overflow-hidden rounded-md border border-emerald-200 bg-white shadow-sm overflow-auto">
                        <div className="border-b border-emerald-100 bg-emerald-700 px-4 py-3">
                            <h2 id="actions-heading" className="text-sm font-semibold text-white">Quick Links</h2>
                        </div>
                        <ul className="divide-y divide-slate-100 px-4 flex flex-col gap-2 py-2">
                        {
                            actions.map((action) => (
                                <a href={actionInfo[action].href} key={actionInfo[action].key} >
                                    <Button className='w-full' variant={'link'}>
                                        {actionInfo[action].label}
                                    </Button>
                                </a>
                            ))
                        }
                        </ul>
                        </section>

                    <section aria-labelledby="progress-heading" className="overflow-hidden rounded-md border border-emerald-200 bg-white shadow-sm overflow-auto">
                        <div className="border-b border-emerald-100 bg-emerald-700 px-4 py-3">
                            <h2 id="progress-heading" className="text-sm font-semibold text-white">Progress</h2>
                        </div>
                        <ul className="divide-y divide-slate-100 px-4">
                            {Statistics.map((stat, index) => (
                                <li key={`${stat.stat}-${index}`} className="flex items-center gap-2 py-3">
                                    <CircleCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-700" />
                                    <span className="min-w-0 flex-1 text-xs leading-4 text-slate-600">{stat.stat}</span>
                                    <span className="text-xl font-semibold tabular-nums text-slate-900">{stat.value}</span>
                                </li>
                            ))}
                        </ul>
                        </section>
                </div>
                <div className='flex flex-col gap-3 border border-slate-200 bg-white shadow-sm gap-6 rounded-md overflow-hidden'>
                        <div className="border-b border-emerald-100 bg-emerald-700 px-4 py-3">
                            <h2 id="forms-heading" className="text-sm font-semibold text-white">Quick Links</h2>
                        </div>

                </div>
            </div>
        </div>

    )
};