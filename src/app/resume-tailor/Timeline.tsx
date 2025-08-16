'use client';

import { useState, useEffect, useTransition } from 'react';
import type { NetworkingActivity } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { getNetworkingActivities } from '@/services/networking-activities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { LogActivityForm } from './LogActivityForm';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig = {
    Pending: { icon: MessageSquare, color: 'bg-yellow-500' },
    Replied: { icon: CheckCircle, color: 'bg-green-500' },
    'No Response': { icon: XCircle, color: 'bg-red-500' },
};

export function Timeline() {
    const { user } = useAuth();
    const [activities, setActivities] = useState<NetworkingActivity[]>([]);
    const [loading, startLoading] = useTransition();
    const [isFormOpen, setIsFormOpen] = useState(false);

    const fetchActivities = async () => {
        if (!user) return;
        startLoading(async () => {
            const fetchedActivities = await getNetworkingActivities(user.uid);
            setActivities(fetchedActivities);
        });
    };

    useEffect(() => {
        fetchActivities();
    }, [user]);

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Networking Timeline</CardTitle>
                        <CardDescription>A log of your networking activities.</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setIsFormOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Log Activity
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto">
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">No activities logged yet.</p>
                    </div>
                ) : (
                    <div className="relative pl-6">
                        {/* Vertical line */}
                        <div className="absolute left-9 top-0 h-full w-0.5 bg-border" />
                        
                        <ul className="space-y-8">
                            {activities.map(activity => {
                                const Icon = statusConfig[activity.status].icon;
                                const color = statusConfig[activity.status].color;
                                return (
                                <li key={activity.id} className="relative">
                                    <div className={`absolute -left-[3px] top-1.5 h-4 w-4 rounded-full ${color} border-4 border-background`} />
                                    <div className="ml-8">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold">{format(new Date(activity.date), 'MMM d, yyyy')}</p>
                                            <Badge variant={
                                                activity.status === 'Replied' ? 'default' : activity.status === 'Pending' ? 'secondary' : 'destructive'
                                            }>{activity.status}</Badge>
                                        </div>
                                        <p className="text-muted-foreground text-sm mt-1">{activity.note}</p>
                                    </div>
                                </li>
                            )})}
                        </ul>
                    </div>
                )}
            </CardContent>
             <LogActivityForm 
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                onActivityLogged={fetchActivities}
            />
        </Card>
    );
}
