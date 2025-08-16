'use client';

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getMarketIntelligence, GetMarketIntelligenceOutput } from "@/ai/flows/get-market-intelligence";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Briefcase, Building, DollarSign, Gauge, GitBranch, Lightbulb, Search, TrendingUp, Users, Map, Star, Clock, BrainCircuit, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function LoadingSkeleton() {
    return (
        <div className="space-y-4 pt-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
}

export function MarketIntelligence() {
    const [jobRole, setJobRole] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [location, setLocation] = useState('');
    const [result, setResult] = useState<GetMarketIntelligenceOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, startTransition] = useTransition();

    const handleGenerate = () => {
        if (!jobRole || !companyName || !location) {
             setError("Please provide a Job Role, Company, and Location.");
            return;
        };
        startTransition(async () => {
            setError(null);
            setResult(null);
            try {
                const res = await getMarketIntelligence({ jobRole, companyName, location });
                setResult(res);
            } catch (e) {
                setError("Failed to fetch market intelligence data.");
                console.error(e);
            }
        });
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input placeholder="Enter job role..." value={jobRole} onChange={(e) => setJobRole(e.target.value)} />
                <Input placeholder="Enter company name..." value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                <Input placeholder="e.g. Bangalore, Hyderabad" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
             <div className="flex justify-end">
                <Button onClick={handleGenerate} disabled={isGenerating || !jobRole || !companyName || !location} className="w-full sm:w-auto">
                     {isGenerating ? <Loader2 className="animate-spin mr-2"/> : <Search className="mr-2"/>}
                      Analyze Market
                </Button>
            </div>
             {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
             
             {isGenerating && <LoadingSkeleton />}

             {result && (
                <div className="space-y-4 pt-2 text-sm">
                   <Accordion type="multiple" defaultValue={['growth-path']} className="w-full space-y-2">
                        
                        <AccordionItem value="growth-path">
                            <AccordionTrigger className="p-3 bg-muted/50 rounded-md text-base">
                                <span className="flex items-center gap-2"><GitBranch/> Growth Path & Salary</span>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 border rounded-b-md">
                                <ul className="list-none space-y-2">
                                    {result.growthPath.map((step, i) => (
                                        <li key={i} className="flex justify-between items-center">
                                            <span>{step.role}</span>
                                            <Badge variant="secondary">{step.salaryRange}</Badge>
                                        </li>
                                    ))}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="skills">
                            <AccordionTrigger className="p-3 bg-muted/50 rounded-md text-base">
                                <span className="flex items-center gap-2"><Star/> Skills in Demand</span>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 border rounded-b-md">
                               <div className="flex flex-wrap gap-2">
                                    {result.skillsInDemand.map((skill, i) => <Badge key={i}>{skill}</Badge>)}
                               </div>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="location-comparison">
                            <AccordionTrigger className="p-3 bg-muted/50 rounded-md text-base">
                                <span className="flex items-center gap-2"><Map/> Location Comparison</span>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 border rounded-b-md space-y-2">
                               <p className="text-muted-foreground">{result.locationComparison.commentary}</p>
                            </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="top-companies">
                            <AccordionTrigger className="p-3 bg-muted/50 rounded-md text-base">
                                <span className="flex items-center gap-2"><Building/> Top Companies Hiring</span>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 border rounded-b-md">
                                <div className="flex flex-wrap gap-2">
                                    {result.topCompaniesHiring.map((company, i) => <Badge variant="outline" key={i}>{company}</Badge>)}
                               </div>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="alumni-insights">
                            <AccordionTrigger className="p-3 bg-muted/50 rounded-md text-base">
                                <span className="flex items-center gap-2"><Users/> Alumni Career Switches</span>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 border rounded-b-md space-y-2">
                               <p><strong className="font-semibold">Average Tenure:</strong> {result.alumniInsights.avgTenure}</p>
                               <div>
                                   <strong className="font-semibold">Common Career Switches:</strong>
                                   <ul className="list-disc list-inside text-muted-foreground">
                                       {result.alumniInsights.careerSwitches.map((step, i) => <li key={i}>{step}</li>)}
                                   </ul>
                               </div>
                            </AccordionContent>
                        </AccordionItem>
                         
                         <AccordionItem value="interview-prep">
                            <AccordionTrigger className="p-3 bg-muted/50 rounded-md text-base">
                                <span className="flex items-center gap-2"><BrainCircuit/> Interview Prep</span>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 border rounded-b-md space-y-2">
                                <p><strong className="font-semibold">Difficulty:</strong> {result.interviewPrep.difficultyRating}</p>
                                <div>
                                   <strong className="font-semibold">Common Question Categories:</strong>
                                   <ul className="list-disc list-inside text-muted-foreground">
                                       {result.interviewPrep.commonQuestionCategories.map((cat, i) => <li key={i}>{cat}</li>)}
                                   </ul>
                               </div>
                            </AccordionContent>
                        </AccordionItem>
                         
                         <AccordionItem value="application-strategy">
                            <AccordionTrigger className="p-3 bg-muted/50 rounded-md text-base">
                                <span className="flex items-center gap-2"><CheckCircle/> Application Strategy</span>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 border rounded-b-md space-y-2">
                                <p><strong className="font-semibold">Best Time to Apply:</strong> {result.applicationStrategy.bestTimeToApply}</p>
                                <div>
                                   <strong className="font-semibold">Success Rates by Method:</strong>
                                   <ul className="list-none text-muted-foreground space-y-1 mt-1">
                                       {result.applicationStrategy.successRates.map((rate, i) => (
                                           <li key={i} className="flex justify-between items-center">
                                               <span>{rate.method}</span>
                                               <span className="font-mono font-bold text-primary">{rate.probability}</span>
                                            </li>
                                       ))}
                                   </ul>
                               </div>
                            </AccordionContent>
                        </AccordionItem>

                   </Accordion>
                </div>
             )}
        </div>
    )
}
