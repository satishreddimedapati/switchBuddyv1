
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { handleAnalysis, type FormState } from "../resume-tailor/actions";
import { Briefcase, Building, Cpu, FileText, Linkedin, Loader2, MapPin, Search, Wand2, ThumbsUp, ThumbsDown, DollarSign, Calculator, History, MessageSquare, Copy, Lightbulb, HelpCircle, Bot } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MarketIntelligence } from "./MarketIntelligence";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" name="action" value="analyze" disabled={pending} className="w-full">
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                </>
            ) : (
                <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Analyze My Fit
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
    const { toast } = useToast();

    const initialState: FormState = { message: '', error: false };
    const [state, formAction] = useActionState(handleAnalysis, initialState);

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

    const handleCopyToClipboard = (text: string | undefined) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied to clipboard!",
        })
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

        <Accordion type="multiple" defaultValue={["role-fit"]} className="w-full space-y-4">
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
                             <CardTitle className="flex items-center gap-2"><Cpu /> Resume & Role Analyzer</CardTitle>
                            <CardDescription>Get a fit score, tailored resume, recruiter message, company insights, and more.</CardDescription>
                        </CardHeader>
                    </AccordionTrigger>
                     <AccordionContent>
                         <CardContent>
                            <form action={formAction} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="resume">Your Resume</Label>
                                        <Textarea id="resume" name="resume" placeholder="Paste your current resume here..." rows={8} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="jobDescription">Job Description</Label>
                                        <Textarea id="jobDescription" name="jobDescription" placeholder="Paste the target job description here..." rows={8} required />
                                    </div>
                                </div>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Details for Analysis</CardTitle>
                                    </CardHeader>
                                     <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                 <Label htmlFor="userName">Your Full Name</Label>
                                                <Input id="userName" name="userName" placeholder="e.g. Satish Reddy" required/>
                                            </div>
                                             <div>
                                                 <Label htmlFor="userContactInfo">Your Contact Info</Label>
                                                <Input id="userContactInfo" name="userContactInfo" placeholder="Phone, LinkedIn URL, etc." required/>
                                            </div>
                                            <div>
                                                <Label htmlFor="companyName">Company Name</Label>
                                                <Input id="companyName" name="companyName" placeholder="e.g. Siemens, Deloitte" required />
                                            </div>
                                            <div className="sm:col-span-3">
                                                <Label htmlFor="location">Job Location</Label>
                                                <Input id="location" name="location" placeholder="e.g. Bangalore" required />
                                                <p className="text-xs text-muted-foreground mt-1">Required for salary benchmark.</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
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

                             {/* Results Dashboard */}
                            {(state.analysis) && (
                                <div className="mt-6 space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Analysis Complete</CardTitle>
                                            <div className="flex items-center gap-4 text-sm pt-2">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-2xl font-bold text-primary">{state.analysis.fitScore}%</span>
                                                    <span className="text-muted-foreground">Fit Score</span>
                                                </div>
                                                <Separator orientation="vertical" className="h-10"/>
                                                <div>
                                                    <p><strong>Skills Match:</strong> {state.analysis.breakdown.skillsMatch}</p>
                                                    <p><strong>Experience Match:</strong> {state.analysis.breakdown.experienceMatch}</p>
                                                </div>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                    <Accordion type="multiple" defaultValue={["resume-optimizer", "recruiter-message"]} className="w-full space-y-4">
                                        
                                        <AccordionItem value="resume-optimizer">
                                            <Card>
                                                <AccordionTrigger className="p-6">
                                                    <CardHeader className="p-0 text-left">
                                                        <CardTitle className="flex items-center gap-2">Resume Optimizer</CardTitle>
                                                        <CardDescription>Your resume, tailored for this specific role.</CardDescription>
                                                    </CardHeader>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <CardContent>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <h4 className="font-semibold mb-2">Missing Keywords</h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {state.analysis.missingSkills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                                                                </div>
                                                            </div>
                                                            <Separator/>
                                                            <div>
                                                                <h4 className="font-semibold mb-2">Tailored CV</h4>
                                                                <pre className="bg-muted/50 p-4 rounded-md whitespace-pre-wrap font-body text-sm leading-relaxed max-h-96 overflow-auto">
                                                                    {state.analysis.tailoredResume}
                                                                </pre>
                                                                <div className="flex justify-end mt-4">
                                                                    <Button variant="outline" onClick={() => handleCopyToClipboard(state.analysis?.tailoredResume)}>
                                                                    <Copy className="mr-2" /> Copy CV Text
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </AccordionContent>
                                            </Card>
                                        </AccordionItem>
                                        
                                        {state.recruiterMessage && (
                                            <AccordionItem value="recruiter-message">
                                            <Card>
                                                <AccordionTrigger className="p-6">
                                                    <CardHeader className="p-0 text-left">
                                                        <CardTitle className="flex items-center gap-2">Recruiter Message</CardTitle>
                                                        <CardDescription>A professional cover letter to send to the recruiter.</CardDescription>
                                                    </CardHeader>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <CardContent>
                                                        <Textarea
                                                            defaultValue={state.recruiterMessage}
                                                            rows={15}
                                                            className="bg-muted/50 p-4 rounded-md whitespace-pre-wrap font-body text-sm leading-relaxed max-h-96 overflow-auto"
                                                        />
                                                        <div className="flex justify-end mt-4">
                                                            <Button variant="outline" onClick={() => handleCopyToClipboard(state.recruiterMessage)}>
                                                                <Copy className="mr-2" /> Copy Message
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </AccordionContent>
                                            </Card>
                                            </AccordionItem>
                                        )}
                                        {state.companyInsights && (
                                            <AccordionItem value="company-insights">
                                                <Card>
                                                    <AccordionTrigger className="p-6">
                                                        <CardHeader className="p-0 text-left">
                                                            <CardTitle className="flex items-center gap-2"><Lightbulb /> Company Insights</CardTitle>
                                                            <CardDescription>Learn about the company culture and interview process.</CardDescription>
                                                        </CardHeader>
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        <CardContent className="space-y-4">
                                                            <div><h4 className="font-semibold">Culture</h4><p className="text-muted-foreground">{state.companyInsights.culture}</p></div>
                                                            <div><h4 className="font-semibold">Interview Process</h4><p className="text-muted-foreground">{state.companyInsights.interviewProcess}</p></div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div><h4 className="font-semibold text-green-600">Pros</h4><ul className="list-disc pl-5 text-muted-foreground">{(state.companyInsights.pros || []).map(pro => <li key={pro}>{pro}</li>)}</ul></div>
                                                                <div><h4 className="font-semibold text-red-600">Cons</h4><ul className="list-disc pl-5 text-muted-foreground">{(state.companyInsights.cons || []).map(con => <li key={con}>{con}</li>)}</ul></div>
                                                            </div>
                                                        </CardContent>
                                                    </AccordionContent>
                                                </Card>
                                            </AccordionItem>
                                        )}
                                        {state.interviewQuestions && (
                                            <AccordionItem value="interview-questions">
                                                <Card>
                                                    <AccordionTrigger className="p-6">
                                                        <CardHeader className="p-0 text-left">
                                                            <CardTitle className="flex items-center gap-2"><HelpCircle /> Predicted Interview Questions</CardTitle>
                                                            <CardDescription>AI-generated questions based on the job and your resume.</CardDescription>
                                                        </CardHeader>
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        <CardContent>
                                                            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                                                                {(state.interviewQuestions.interviewQuestions || []).map(q => <li key={q}>{q}</li>)}
                                                            </ul>
                                                        </CardContent>
                                                    </AccordionContent>
                                                </Card>
                                            </AccordionItem>
                                        )}
                                        {state.salaryBenchmark && (
                                            <AccordionItem value="salary-benchmark">
                                                <Card>
                                                    <AccordionTrigger className="p-6">
                                                        <CardHeader className="p-0 text-left">
                                                            <CardTitle className="flex items-center gap-2"><DollarSign /> Salary Benchmark</CardTitle>
                                                            <CardDescription>An estimated salary for this role in the specified location.</CardDescription>
                                                        </CardHeader>
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                         <CardContent>
                                                            <Alert>
                                                                <Bot className="h-4 w-4" />
                                                                <AlertTitle className="text-xl font-bold text-primary">
                                                                    {state.salaryBenchmark.salaryRange}
                                                                </AlertTitle>
                                                                <AlertDescription>
                                                                    {state.salaryBenchmark.commentary}
                                                                </AlertDescription>
                                                            </Alert>
                                                        </CardContent>
                                                    </AccordionContent>
                                                </Card>
                                            </AccordionItem>
                                        )}
                                    </Accordion>
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
                        </Header>
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

    
