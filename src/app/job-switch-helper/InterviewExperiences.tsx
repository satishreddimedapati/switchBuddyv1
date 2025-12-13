
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import type { InterviewExperience } from "@/lib/types";
import { getInterviewExperiences } from "@/services/interview-experiences";
import { FileText, PlusCircle, Loader2, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";


function LoadingState() {
    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Skeleton className="h-10 w-40" />
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
    )
}

function NoExperiences() {
    return (
        <div className="text-center p-8 border-dashed border-2 rounded-lg flex flex-col items-center gap-4">
            <h3 className="text-xl font-semibold">No Interview Experiences Logged</h3>
            <p className="text-muted-foreground">Log your first real interview to start analyzing and improving.</p>
            <Button asChild>
                <Link href="/job-switch-helper/interview-experiences/new">
                    <PlusCircle className="mr-2"/>
                    Log New Experience
                </Link>
            </Button>
        </div>
    )
}


export function InterviewExperiences() {
    const { user } = useAuth();
    const router = useRouter();
    const [experiences, setExperiences] = useState<InterviewExperience[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchExperiences() {
            if (!user) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const userExperiences = await getInterviewExperiences(user.uid);
                userExperiences.sort((a,b) => new Date(b.interviewDate).getTime() - new Date(a.interviewDate).getTime());
                setExperiences(userExperiences);
            } catch (error) {
                console.error("Failed to fetch interview experiences", error);
            } finally {
                setLoading(false);
            }
        }
        fetchExperiences();
    }, [user]);

    if (loading) {
        return <LoadingState />;
    }

    return (
        <div className="flex flex-col gap-8 pt-6">
            <div className="flex justify-end">
                 <Button asChild>
                    <Link href="/job-switch-helper/interview-experiences/new">
                        <PlusCircle className="mr-2"/>
                        Log New Experience
                    </Link>
                </Button>
            </div>

            {experiences.length === 0 ? <NoExperiences /> : (
                <div className="space-y-4">
                    {experiences.map(exp => (
                        <Card key={exp.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push(`/job-switch-helper/interview-experiences/${exp.id}`)}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{exp.companyName} - {exp.role}</CardTitle>
                                        <CardDescription>
                                            {format(parseISO(exp.interviewDate), 'PPP')} - {exp.roundType} Round
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline" className="flex items-center gap-1 text-base">
                                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                        {exp.overallRating}/10
                                    </Badge>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
