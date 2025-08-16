'use client';

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getMarketIntelligence, GetMarketIntelligenceOutput } from "@/ai/flows/get-market-intelligence";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Briefcase, Building, DollarSign, Gauge, GitBranch, Lightbulb, Search, TrendingUp, Users } from "lucide-react";

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

interface MarketIntelligenceProps {
    jobRole: string;
}

export function MarketIntelligence({ jobRole }: MarketIntelligenceProps) {
    const [companyName, setCompanyName] = useState('');
    const [location, setLocation] = useState('Bangalore');
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
                <Input placeholder="Enter company name..." value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                <Input placeholder="Enter location..." value={location} onChange={(e) => setLocation(e.target.value)} />
                <Button onClick={handleGenerate} disabled={isGenerating || !companyName || !location || !jobRole}>
                     {isGenerating ? <Skeleton className="h-full w-full" /> : <><Search className="mr-2"/> Analyze</>}
                </Button>
            </div>
             {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
             
             {isGenerating && <LoadingSkeleton />}

             {result && (
                <div className="space-y-4 pt-2 text-sm">
                   <Accordion type="multiple" defaultValue={['growth-path']} className="w-full space-y-2">
                        <AccordionItem value="growth-path">
                            <AccordionTrigger className="p-3 bg-muted/50 rounded-md text-base">
                                <span className="flex items-center gap-2"><GitBranch/> Growth Path Insights</span>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 border rounded-b-md">
                                <ul className="list-none space-y-2">
                                    {result.growthPath.map((step, i) => (
                                        <li key={i} className="flex items-center">
                                            <span>{step}</span>
                                            {i < result.growthPath.length - 1 && <span className="mx-2 text-muted-foreground">&rarr;</span>}
                                        </li>
                                    ))}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="market-demand">
                            <AccordionTrigger className="p-3 bg-muted/50 rounded-md text-base">
                                <span className="flex items-center gap-2"><TrendingUp/> Job Market Demand Index</span>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 border rounded-b-md space-y-2">
                               <p className="font-bold text-lg text-primary">{result.marketDemand.demandIndex}</p>
                               <p className="text-muted-foreground">{result.marketDemand.commentary}</p>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="alumni-insights">
                            <AccordionTrigger className="p-3 bg-muted/50 rounded-md text-base">
                                <span className="flex items-center gap-2"><Users/> Company Alumni Insights</span>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 border rounded-b-md space-y-2">
                               <p><strong className="font-semibold">Average Tenure:</strong> {result.alumniInsights.avgTenure}</p>
                               <div>
                                   <strong className="font-semibold">Common Next Steps:</strong>
                                   <ul className="list-disc list-inside text-muted-foreground">
                                       {result.alumniInsights.commonNextSteps.map((step, i) => <li key={i}>{step}</li>)}
                                   </ul>
                               </div>
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="interview-difficulty">
                            <AccordionTrigger className="p-3 bg-muted/50 rounded-md text-base">
                                <span className="flex items-center gap-2"><Gauge/> Interview Difficulty Meter</span>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 border rounded-b-md space-y-2">
                                <p className="font-bold text-lg text-primary">{result.interviewDifficulty.difficultyRating}</p>
                                <p className="text-muted-foreground">{result.interviewDifficulty.commentary}</p>
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="application-strategy">
                            <AccordionTrigger className="p-3 bg-muted/50 rounded-md text-base">
                                <span className="flex items-center gap-2"><Lightbulb/> Application Strategy Tips</span>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 border rounded-b-md space-y-2">
                                <p><strong className="font-semibold">Recommended Strategy:</strong> {result.applicationStrategy.recommendedStrategy}</p>
                                <p><strong className="font-semibold">Response Probability:</strong> {result.applicationStrategy.responseProbability}</p>
                            </AccordionContent>
                        </AccordionItem>
                   </Accordion>
                </div>
             )}
        </div>
    )
}
