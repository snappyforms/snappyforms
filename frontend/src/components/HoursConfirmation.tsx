'use client';
import { UserCircle } from 'lucide-react';
import Link from "next/link";
import { Button } from '@/components/ui/button';
import { useState } from "react";
import { useAuth } from '@/AuthContext';

export default function HoursConfirmation() {

    const { activePage, setActivePage } = useAuth();
    const [hours, setHours] = useState<number | null>(null);
    const [cadence, setCadence] = useState<string | ['week' | 'month' | 'quarter'] | null>('week');

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

            <div className='flex flex-col gap-10 bg-slate-100 p-4 pt-0 rounded-sm border shadow-sm overflow-auto max-h-[80vh]'>
                <h1 className="mt-4 text-lg font-medium">Required  <span className='text-emerald-700'>Work Hours Needed</span></h1>
                <div className='flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm gap-6'>
                    <p className='text-sm font-medium leading-6 text-slate-800'>Tell us more about your work hour requirements. How many hours do you need to keep your benefits?</p>
                    <div className="flex flex-row gap-1 rounded border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
                        <span>I need
                            <input 
                            type="text" 
                            name="hours" 
                            id="hours"
                            placeholder='hours' 
                            className='px-2 py-1 mx-2 border-b w-[50px]' 
                            style={{ outline: 'none' }}
                            onChange={(e) => setHours(Number(e.target.value))} />
                            <span>hours each
                                <select 
                                name="cadence" 
                                id="cadence" 
                                className='px-2 py-1 mx-2 border-b' 
                                style={{ outline: 'none' }} 
                                onChange={(e) => setCadence(e.target.value)}>
                                    <option value="week">week</option>
                                    <option value="month">month</option>
                                    <option value="quarter">quarter</option>
                                </select>
                                to satisfy my work hour requirements.</span></span>
                    </div>
                </div>
                <a href="/newForm" className='grid w-full'>
                    <Button 
                    disabled={hours == null || cadence == null} 
                    className='w-fit justify-self-end'
                    onClick={() => {setActivePage(activePage+1); }}>Save</Button>
                </a>
            </div>
        </div>
    )
}