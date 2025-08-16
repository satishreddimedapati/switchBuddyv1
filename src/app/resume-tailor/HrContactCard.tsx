'use client';

import type { HrContact } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Linkedin, User, Building, Mail } from 'lucide-react';
import Link from 'next/link';

interface HrContactCardProps {
    contact: HrContact;
}

export function HrContactCard({ contact }: HrContactCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2"><User />{contact.hrName}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1"><Building size={16}/>{contact.company}</CardDescription>
                    </div>
                     <Link href={contact.linkedinUrl} target="_blank" passHref>
                        <Button variant="ghost" size="icon" asChild>
                            <a aria-label="LinkedIn Profile">
                               <Linkedin className="h-5 w-5 text-blue-600" />
                            </a>
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent className='space-y-2'>
                <p className="text-sm font-medium text-muted-foreground">Role: {contact.jobRole}</p>
                {contact.email && <p className="text-sm text-muted-foreground flex items-center gap-2"><Mail size={16} />{contact.email}</p>}
            </CardContent>
        </Card>
    );
}
