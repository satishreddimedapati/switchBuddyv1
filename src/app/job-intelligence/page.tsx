

'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useState, useTransition } from "react";
import { useActionState } from 'react';
import { handleTailorResume, type FormState } from "../resume-tailor/actions";
import { Briefcase, Building, Cpu, FileText, Linkedin, Loader2, MapPin, Search, Wand2, ThumbsUp, ThumbsDown, DollarSign, Calculator } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MarketIntelligence } from "./MarketIntelligence";


function SubmitButton() {
    const [pending, startTransition] = useTransition();
     const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (pending) {
            e.preventDefault();
        }
    };
    return (
        <Button type="submit" disabled={pending} onClick={handleClick} className="w-full sm:w-auto">
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                </>
            ) : (
                <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Calculate Fit Score
                </>
            )}
        </Button>
    )
}

type FilterType = 'time' | 'location';
interface Filter {
    label: string;
    type: FilterType;
    value: string;
    paramName: 'f_TPR' | 'location';
}

const smartFilters: Filter[] = [
    { label: "Last 24h", type: 'time', value: 'r86400', paramName: 'f_TPR' },
    { label: "Last 7 days", type: 'time', value: 'r604800', paramName: 'f_TPR' },
    { label: "Hyderabad", type: 'location', value: 'Hyderabad, Telangana, India', paramName: 'location' },
    { label: "Bangalore", type: 'location', value: 'Bengaluru, Karnataka, India', paramName: 'location' },
];

export default function JobIntelligencePage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Filter[]>([]);

    const initialState: FormState = { message: '', error: false };
    const [state, formAction] = useActionState(handleTailorResume, initialState);

    const toggleFilter = (filter: Filter) => {
        setActiveFilters(prev => {
            const isAlreadyActive = prev.some(f => f.label === filter.label);
            if (isAlreadyActive) {
                return prev.filter(f => f.label !== filter.label);
            }
            if (filter.type === 'time') {
                const otherTimeFiltersRemoved = prev.filter(f => f.type !== 'time');
                return [...otherTimeFiltersRemoved, filter];
            }
            return [...prev, filter];
        });
    }

    const generateLinkedInJobsUrl = () => {
        const url = new URL('https://www.linkedin.com/jobs/search/');
        if (searchTerm) {
            url.searchParams.set('keywords', searchTerm);
        }

        activeFilters.forEach(filter => {
            if (filter.paramName === 'location') {
                 const existing = url.searchParams.get('location');
                 url.searchParams.set('location', existing ? `${existing} OR ${filter.value}` : filter.value);
            } else {
                 url.searchParams.set(filter.paramName, filter.value);
            }
        });
        
        return url.toString();
    }
    
    const generateLinkedInRecruiterUrl = () => {
        const url = new URL('https://www.linkedin.com/search/results/people/');
        const query = `${searchTerm} recruiter`;
        url.searchParams.set('keywords', query);
        url.searchParams.set('sid', '~SJ');
        return url.toString();
    }

    const generateNaukriUrl = () => {
        if (!searchTerm) return 'https://www.naukri.com';
        const keyword = searchTerm.toLowerCase().replace(/\s+/g, '-');
        return `https://www.naukri.com/${keyword}-jobs`;
    }


    return (
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Job Intelligence
          </h1>
          <p className="text-muted-foreground">
            Analyze job roles, benchmark salaries, and find the perfect fit.
          </p>
        </div>

        <Accordion type="multiple" defaultValue={["job-search"]} className="w-full space-y-4">
            <AccordionItem value="job-search">
                <Card>
                    <AccordionTrigger className="p-6">
                        <CardHeader className="p-0 text-left">
                            <CardTitle className="flex items-center gap-2"><Search /> Job Search & Recruiter Shortcut</CardTitle>
                        </CardHeader>
                    </AccordionTrigger>
                    <AccordionContent>
                         <CardContent className="space-y-4">
                             <div className="flex flex-col sm:flex-row gap-2">
                                <Input 
                                    placeholder="Enter role/tech, e.g. Angular Developer"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <div className="flex gap-2">
                                  <Button asChild className="w-full sm:w-auto flex-1">
                                      <a href={generateLinkedInJobsUrl()} target="_blank" rel="noopener noreferrer">
                                         <Linkedin className="mr-2"/> LinkedIn
                                      </a>
                                  </Button>
                                  <Button asChild className="w-full sm:w-auto flex-1" variant="outline">
                                       <a href={generateNaukriUrl()} target="_blank" rel="noopener noreferrer">
                                         <Search className="mr-2"/> Naukri
                                      </a>
                                  </Button>
                                </div>
                            </div>
                             <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-sm font-medium">Quick Filters:</span>
                                {smartFilters.map(filter => (
                                    <Badge 
                                        key={filter.label} 
                                        variant={activeFilters.some(f => f.label === filter.label) ? 'default' : 'secondary'}
                                        onClick={() => toggleFilter(filter)}
                                        className="cursor-pointer"
                                    >
                                        {filter.label}
                                    </Badge>
                                ))}
                            </div>
                            <Separator />
                            <Button asChild variant="outline" className="w-full" disabled={!searchTerm}>
                                <a href={generateLinkedInRecruiterUrl()} target="_blank" rel="noopener noreferrer">
                                    <Linkedin className="mr-2"/> Find Recruiters for &quot;{searchTerm || '...'}&quot;
                                </a>
                            </Button>
                        </CardContent>
                    </AccordionContent>
                </Card>
            </AccordionItem>
            
            <AccordionItem value="role-fit">
                 <Card>
                    <AccordionTrigger className="p-6">
                        <CardHeader className="p-0 text-left">
                             <CardTitle className="flex items-center gap-2"><Cpu /> Role Fit Score</CardTitle>
                            <CardDescription>Upload your resume and a job description to get your fit score and identify skill gaps.</CardDescription>
                        </CardHeader>
                    </AccordionTrigger>
                     <AccordionContent>
                         <CardContent>
                            <form action={formAction} className="space-y-4">
                                 <Textarea name="resume" placeholder="Paste your current resume here..." rows={8} required />
                                 <Textarea name="jobDescription" placeholder="Paste the target job description here..." rows={8} required />
                                 <div className="flex justify-end">
                                    <SubmitButton />
                                </div>
                            </form>
                             {state.error && (
                                <Alert variant="destructive" className="mt-4">
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{state.message}</AlertDescription>
                                </Alert>
                            )}
                            {state.tailoredResume && (
                                <div className="mt-6">
                                    <Separator className="my-4" />
                                    <h3 className="font-semibold mb-2">Analysis Result:</h3>
                                    <pre className="bg-muted/50 p-4 rounded-md whitespace-pre-wrap font-body text-sm leading-relaxed max-h-96 overflow-auto">
                                        {state.tailoredResume}
                                    </pre>
                                </div>
                            )}
                        </CardContent>
                    </AccordionContent>
                 </Card>
            </AccordionItem>
            
            <AccordionItem value="market-intelligence">
                 <Card>
                    <AccordionTrigger className="p-6">
                         <CardHeader className="p-0 text-left">
                            <CardTitle className="flex items-center gap-2"><Building/> Market Intelligence & Salary Calculator</CardTitle>
                            <CardDescription>Get insights on career paths, skills, top companies and a personalized salary estimate.</CardDescription>
                        </CardHeader>
                    </AccordionTrigger>
                     <AccordionContent>
                        <CardContent>
                            <MarketIntelligence />
                        </CardContent>
                    </AccordionContent>
                 </Card>
            </AccordionItem>

        </Accordion>
      </div>
  );
}
