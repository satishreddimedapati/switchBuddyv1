'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useFormStatus } from "react-dom";
import { useActionState, useState, useTransition } from "react";
import { handleTailorResume, type FormState } from "../resume-tailor/actions";
import { Briefcase, Building, Cpu, FileText, Linkedin, Loader2, MapPin, Search, Wand2, ThumbsUp, ThumbsDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getCompanyInsights, GetCompanyInsightsOutput } from "@/ai/flows/get-company-insights";
import { getSalaryBenchmark, GetSalaryBenchmarkOutput } from "@/ai/flows/get-salary-benchmark";
import { Skeleton } from "@/components/ui/skeleton";


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
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
}

const smartFilters: Filter[] = [
    { label: "Last 24h", type: 'time', value: 'r86400' },
    { label: "Last 7 days", type: 'time', value: 'r604800' },
    { label: "Hyderabad", type: 'location', value: 'Hyderabad, Telangana, India' },
    { label: "Bangalore", type: 'location', value: 'Bengaluru, Karnataka, India' },
];

function CompanyInsightsWidget() {
    const [companyName, setCompanyName] = useState('');
    const [result, setResult] = useState<GetCompanyInsightsOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, startTransition] = useTransition();

    const handleGenerate = () => {
        if (!companyName) return;
        startTransition(async () => {
            setError(null);
            setResult(null);
            try {
                const res = await getCompanyInsights({ companyName });
                setResult(res);
            } catch (e) {
                setError("Failed to fetch company insights.");
                console.error(e);
            }
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building/> Company Insights</CardTitle>
                <CardDescription>Culture, reviews, and salary data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input placeholder="Enter company name..." value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                    <Button onClick={handleGenerate} disabled={isGenerating || !companyName}>
                        {isGenerating ? <Loader2 className="animate-spin" /> : <Search />}
                    </Button>
                </div>
                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                {isGenerating && (
                    <div className="space-y-2 pt-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                )}
                {result && (
                    <div className="space-y-4 pt-2 text-sm">
                        <div>
                            <h4 className="font-semibold">Culture</h4>
                            <p className="text-muted-foreground">{result.culture}</p>
                        </div>
                         <div>
                            <h4 className="font-semibold">Interview Process</h4>
                            <p className="text-muted-foreground">{result.interviewProcess}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold flex items-center gap-2"><ThumbsUp className="text-green-500"/> Pros</h4>
                                <ul className="list-disc list-inside text-muted-foreground">
                                    {result.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                                </ul>
                            </div>
                             <div>
                                <h4 className="font-semibold flex items-center gap-2"><ThumbsDown className="text-red-500" /> Cons</h4>
                                <ul className="list-disc list-inside text-muted-foreground">
                                    {result.cons.map((con, i) => <li key={i}>{con}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function SalaryBenchmarkingWidget({ jobRole }: { jobRole: string }) {
    const [location, setLocation] = useState('Bangalore');
    const [result, setResult] = useState<GetSalaryBenchmarkOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, startTransition] = useTransition();

    const handleGenerate = () => {
        if (!jobRole || !location) return;
        startTransition(async () => {
            setError(null);
            setResult(null);
            try {
                const res = await getSalaryBenchmark({ jobRole, location });
                setResult(res);
            } catch (e) {
                setError("Failed to fetch salary data.");
                console.error(e);
            }
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><MapPin /> Salary Benchmarking</CardTitle>
                <CardDescription>Compare salary expectations with market data.</CardDescription>
            </CardHeader>
             <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input placeholder="Enter location..." value={location} onChange={(e) => setLocation(e.target.value)} />
                    <Button onClick={handleGenerate} disabled={isGenerating || !location || !jobRole}>
                         {isGenerating ? <Loader2 className="animate-spin" /> : <Search />}
                    </Button>
                </div>
                 {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                 {isGenerating && (
                    <div className="space-y-2 pt-2">
                        <Skeleton className="h-8 w-1/2 mx-auto" />
                        <Skeleton className="h-4 w-3/4 mx-auto" />
                    </div>
                 )}
                 {result && (
                    <div className="text-center pt-2">
                        <p className="text-2xl font-bold text-primary">{result.salaryRange}</p>
                        <p className="text-sm text-muted-foreground">{result.commentary}</p>
                    </div>
                 )}
            </CardContent>
        </Card>
    );
}


export default function JobIntelligencePage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Filter[]>([]);

    const initialState: FormState = { message: '', error: false };
    const [state, formAction] = useActionState(handleTailorResume, initialState);

    const toggleFilter = (filter: Filter) => {
        setActiveFilters(prev => {
            if (filter.type === 'time') {
                const otherFilters = prev.filter(f => f.type !== 'time');
                const isAlreadyActive = prev.some(f => f.label === filter.label);
                return isAlreadyActive ? otherFilters : [...otherFilters, filter];
            } else {
                 const isAlreadyActive = prev.some(f => f.label === filter.label);
                 return isAlreadyActive ? prev.filter(f => f.label !== filter.label) : [...prev, filter];
            }
        });
    }

    const generateLinkedInJobsUrl = () => {
        const url = new URL('https://www.linkedin.com/jobs/search/');
        if (searchTerm) {
            url.searchParams.set('keywords', searchTerm);
        }

        const timeFilter = activeFilters.find(f => f.type === 'time');
        if (timeFilter) {
            url.searchParams.set('f_TPR', timeFilter.value);
        }

        const locationFilters = activeFilters.filter(f => f.type === 'location');
        if (locationFilters.length > 0) {
            url.searchParams.set('location', locationFilters.map(f => f.value).join(' OR '));
        }

        return url.toString();
    }
    
     const generateLinkedInRecruiterUrl = () => {
        const url = new URL('https://www.linkedin.com/search/results/people/');
        const query = `${searchTerm} recruiter`;
        url.searchParams.set('keywords', query);
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

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Search /> Job Search</CardTitle>
            </CardHeader>
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
            </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Cpu /> Role Fit Score</CardTitle>
                        <CardDescription>Upload your resume and a job description to get your fit score and identify skill gaps.</CardDescription>
                    </CardHeader>
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
                </Card>
            </div>

            {/* Right Column */}
             <div className="space-y-8">
                <CompanyInsightsWidget />
                <SalaryBenchmarkingWidget jobRole={searchTerm} />
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Linkedin /> Recruiter Shortcut</CardTitle>
                        <CardDescription>Find recruiters for this role on LinkedIn.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Button asChild variant="outline" className="w-full" disabled={!searchTerm}>
                            <a href={generateLinkedInRecruiterUrl()} target="_blank" rel="noopener noreferrer">
                                Find Recruiters for &quot;{searchTerm || '...'}&quot;
                            </a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
  );
}
