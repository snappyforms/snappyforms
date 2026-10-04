import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { act, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { User, UserCircle, Circle } from 'lucide-react';
import { Reminders } from '../demo/data/reminders';

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
            <div className='flex flex-col gap-2 bg-slate-100 p-4 rounded-sm border shadow-sm'>
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


            {/* Action Buttons - New form, My Documents, Resource Center, Settings */}
            <div className='flex flex-col gap-2 py-8'>
                {
                actions.map((action) => (
                    <a href={actionInfo[action].href} key={actionInfo[action].key} >
                    <Button className='w-full'>
                        {actionInfo[action].label}
                    </Button>
                    </a>
                ))
                }
            </div>

        </div>

    )
};