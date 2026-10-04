'use client';
import { UserCircle } from 'lucide-react';
import Link from "next/link";
import { Button } from '@/components/ui/button';
import { useState } from "react";

export default function Checklist() {

    const [currentPhase, setCurrentPhase] = useState<number>(0);
    const checklistComponents = {
        requirementsYes: { key: 'requirements', label: 'Confirm Work Hour Requirement Exemptions', href: 'requirementCheck', tooltip: 'Check with your benfits officier (CAO) or review the exemption options in our resource center.' },
        hoursNeeded: { key: 'hours', label: 'Hours Confirmation', href: 'requirementCheck', tooltip: 'Your benefits officer (CAO) can tell you how many hours are needed to stay enrolled in benefits.' },
        logActivities: { key: 'log', label: 'Log Activities', href: 'requirementCheck', tooltip: 'Check the resource center (or contact your CAO) for activities that count toward your work hour requirements.' },
        attest: { key: 'attest', label: 'Submit Hours for Review', href: 'requirementCheck', tooltip: 'Click send to push your activity log to the applicable organization(s) for approval.' },
        confirmation: { key: 'org', label: 'Org Review & Confirmation', href: 'requirementCheck', tooltip: 'The applicable organization(s) is reviewing your hours.' },
        info: { key: 'info', label: 'Additional Information', href: 'requirementCheck', tooltip: 'The organization(s) is requesting additional information to submit your form. Review the request.' },
        submit: { key: 'submit', label: 'Form-ABC Submitted to State!', href: 'requirementCheck', tooltip: 'The organization(s) completed & submitted your form to the state.' }
    } as const;

    const components = Object.keys(checklistComponents) as Array<keyof typeof checklistComponents>;
    const componentKeys: Array<keyof typeof checklistComponents> = ['requirementsYes', 'hoursNeeded', 'logActivities', 'attest', 'confirmation', 'info', 'submit'];

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="grid grid-cols-3 items-end">
                <Link href="/home" className="text-sm text-muted-foreground">
                    ← Back
                </Link>

                <h1 className="mt-4 text-2xl font-bold">SnappyForms</h1>
                <span className='justify-self-end'><UserCircle /></span>
            </div>

            {/* Checklist Body */}
            <div className='grid grid-rows-[1fr_auto] gap-10 max-h-[85vh]'>
                <div className='flex flex-col gap-10 bg-slate-100 p-4 pt-0 rounded-sm border shadow-sm  overflow-auto'>
                    <div key='checklist-header' className='grid grid-cols-2 items-center sticky top-0 bg-slate-100 py-4 relative z-10'>
                        <label className="text-md font-medium text-slate-500">Form XX-XXX Checklist</label>
                        <input type='text' placeholder='Custom tag' className='rounded-sm pl-4 pr-2 text-sm w-fit justify-self-end'></input>
                    </div>
                    <div key='checklist' className='grid grid-rows-7 justify-items-center z-0'>
                        {
                            componentKeys.map((component, idx) => (
                                <a className='w-full flex flex-col items-center'
                                href={checklistComponents[component].href}>
                                    <div key={idx}
                                        className='rounded-[50%]  w-[50%] h-[8rem] text-md text-center place-content-center p-4 bg-white shadow-sm grid grid-cols-[1fr_10px] cursor-pointer transition delay-150 ease-in-out hover:-translate-y-1 hover:scale-105'
                                        style={{
                                            border: idx < currentPhase ? '1px solid oklch(95% 0.052 163.051)' : idx === currentPhase ? '1px solid oklch(50.8% 0.118 165.612)' : '',
                                            backgroundColor: idx < currentPhase ? 'oklch(98.2% 0.018 155.826)' : idx === currentPhase ? 'oklch(50.8% 0.118 165.612)' : '',
                                            color: idx < currentPhase ? 'oklch(70.5% 0.015 286.067)' : idx === currentPhase ? 'white' : '',
                                        }}>
                                        {checklistComponents[component].label}
                                        <div
                                            className="group/tooltip relative top-[-1rem] h-fit w-fit cursor-help rounded-lg border border-slate-400 bg-white px-3 text-black
                                            after:invisible after:absolute after:left-1/2 after:top-full after:z-20 after:mt-2
                                            after:w-56 after:-translate-x-1/2 after:rounded after:bg-slate-900
                                            after:px-3 after:py-2 after:text-left after:text-xs after:leading-5
                                            after:text-white after:opacity-0 after:shadow-lg after:transition-opacity
                                            after:content-[attr(data-tooltip)]
                                            hover:after:visible hover:after:opacity-100"
                                            data-tooltip={checklistComponents[component].tooltip}
                                            style={{
                                                border: idx < currentPhase ? '1px solid oklch(95% 0.052 163.051)' : idx === currentPhase ? '1px solid oklch(50.8% 0.118 165.612)' : '',
                                                backgroundColor: idx < currentPhase ? 'oklch(98.2% 0.018 155.826)' : '',
                                                color: idx < currentPhase ? 'oklch(50.8% 0.118 165.612)' : idx === currentPhase ? 'oklch(59.6% 0.145 163.225)' : '',
                                            }}>

                                            {idx < currentPhase ? "✓" : "i"}
                                        </div>
                                    </div>
                                    {checklistComponents[component].key === 'submit' ? null :
                                        (<div key={idx.toString().concat('-divider')}><span className='text-slate-400'>⇣</span></div>)
                                    }
                                </a>
                            ))
                        }
                    </div>
                </div>
                <div key='checklistButtons' className='grid grid-cols-2 gap-10'>
                    <a href="/home"><Button className='bg-red-400 w-full'>Discard Checklist</Button></a>
                    <a href="/home"><Button className='w-full'>Save Checklist</Button></a>

                </div>
            </div>

        </div>
    )
}