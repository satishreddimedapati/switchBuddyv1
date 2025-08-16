
'use client';

import { useState, useTransition, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getMarketIntelligence, GetMarketIntelligenceOutput } from "@/ai/flows/get-market-intelligence";
import { getPersonalizedSalaryEstimate, GetPersonalizedSalaryEstimateOutput } from "@/ai/flows/get-personalized-salary-estimate";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Briefcase, Building, DollarSign, Gauge, GitBranch, Lightbulb, Search, TrendingUp, Users, Map, Star, Clock, BrainCircuit, CheckCircle, Loader2, Wand2, Sparkles, Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { MarketIntelHistoryItem } from "@/lib/types";
import { addSearchToHistory } from "@/services/market-intelligence-history";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";


const marketIntelSchema = z.object({
    jobRole: z.string().min(1, "Job role is required"),
    companyName: z.string().min(1, "Company name is required"),
    location: z.string().min(1, "Location is required"),
    yearsOfExperience: z.coerce.number().min(0).optional(),
})
type MarketIntelFormValues = z.infer<typeof marketIntelSchema>;

type CurrentAnalysis = {
    input: MarketIntelFormValues;
    intelResult: GetMarketIntelligenceOutput;
    salaryResult: GetPersonalizedSalaryEstimateOutput | null;
} | null;


function LoadingSkeleton() {
    return (
        <div className="space-y-4 pt-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
}

interface MarketIntelligenceProps {
    historyItem?: MarketIntelHistoryItem | null;
    onNewSearch: () => void;
}

export function MarketIntelligence({ historyItem, onNewSearch }: MarketIntelligenceProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [currentAnalysis, setCurrentAnalysis] = useState<CurrentAnalysis>(null);
    const [isCurrentSearchSaved, setIsCurrentSearchSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, startGenerateTransition] = useTransition();
    const [isSaving, startSaveTransition] = useTransition();

    const form = useForm<MarketIntelFormValues>({
        resolver: zodResolver(marketIntelSchema),
        defaultValues: {
            jobRole: '',
            companyName: '',
            location: '',
            yearsOfExperience: 0,
        }
    });

     useEffect(() => {
        if (historyItem) {
            form.reset({
                jobRole: historyItem.input.jobRole,
                companyName: historyItem.input.companyName,
                location: historyItem.input.location,
                yearsOfExperience: historyItem.input.yearsOfExperience,
            });
            setCurrentAnalysis({
                input: historyItem.input,
                intelResult: historyItem.intelResult,
                salaryResult: historyItem.salaryResult,
            });
            setIsCurrentSearchSaved(true);
            setError(null);
        }
    }, [historyItem, form]);


    const onSubmit = (data: MarketIntelFormValues) => {
        if (!user) {
            setError("You must be logged in to use this feature.");
            return;
        }
        startGenerateTransition(async () => {
            setError(null);
            setCurrentAnalysis(null);
            onNewSearch(); 
            setIsCurrentSearchSaved(false);

            try {
                const intelRes = await getMarketIntelligence({ jobRole: data.jobRole, companyName: data.companyName, location: data.location });
                
                let salaryRes = null;
                if (data.yearsOfExperience !== undefined && data.yearsOfExperience >= 0 && intelRes.skillsInDemand.length > 0) {
                   salaryRes = await getPersonalizedSalaryEstimate({ 
                        jobRole: data.jobRole, 
                        yearsOfExperience: data.yearsOfExperience, 
                        location: data.location, 
                        skills: intelRes.skillsInDemand 
                    });
                }
                
                setCurrentAnalysis({
                    input: data,
                    intelResult: intelRes,
                    salaryResult: salaryRes,
                });

            } catch (e) {
                setError("Failed to fetch market intelligence data.");
                console.error(e);
            }
        });
    }

    const handleSaveSearch = () => {
        if (!user || !currentAnalysis) {
            toast({ title: "Error", description: "No results to save.", variant: "destructive" });
            return;
        }
        startSaveTransition(async () => {
            try {
                await addSearchToHistory(user.uid, currentAnalysis);
                setIsCurrentSearchSaved(true);
                toast({ title: "Success", description: "Search saved to your history." });
            } catch (error) {
                console.error("Failed to save search:", error);
                toast({ title: "Error", description: "Could not save your search.", variant: "destructive" });
            }
        });
    };

    const intelResult = currentAnalysis?.intelResult;
    const salaryResult = currentAnalysis?.salaryResult;

    return (
        <div className="space-y-4">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="jobRole">Job Role</Label>
                        <Input id="jobRole" placeholder="e.g. Software Engineer" {...form.register('jobRole')} />
                        {form.formState.errors.jobRole && <p className="text-destructive text-sm mt-1">{form.formState.errors.jobRole.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="companyName">Company</Label>
                        <Input id="companyName" placeholder="e.g. Google" {...form.register('companyName')} />
                        {form.formState.errors.companyName && <p className="text-destructive text-sm mt-1">{form.formState.errors.companyName.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="location">Location(s)</Label>
                        <Input id="location" placeholder="e.g. Bangalore, Hyderabad" {...form.register('location')} />
                        {form.formState.errors.location && <p className="text-destructive text-sm mt-1">{form.formState.errors.location.message}</p>}
                    </div>
                </div>
                 <div>
                    <Label htmlFor="yearsOfExperience">Years of Experience (for personalized salary)</Label>
                    <Input id="yearsOfExperience" type="number" {...form.register('yearsOfExperience')} className="max-w-xs" />
                </div>
                
                <div className="flex justify-end">
                     <Button type="submit" disabled={isGenerating || !form.formState.isValid} className="w-full sm:w-auto">
                         {isGenerating ? <Loader2 className="animate-spin mr-2"/> : <Search className="mr-2"/>}
                          Analyze Market
                    </Button>
                </div>
            </form>
             
             {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
             
             {isGenerating && <LoadingSkeleton />}

             {(intelResult || salaryResult) && (
                 <div className="space-y-4 pt-2 text-sm">
                    <div className="flex justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSaveSearch}
                            disabled={isSaving || isCurrentSearchSaved}
                        >
                            {isSaving ? <Loader2 className="animate-spin" /> : <Bookmark />}
                            {isCurrentSearchSaved ? 'Saved' : 'Save this Search'}
                        </Button>
                    </div>
                    <Accordion type="multiple" defaultValue={['personalized-salary', 'growth-path']} className="w-full space-y-2">
                        {salaryResult && (
                            <AccordionItem value="personalized-salary">
                                <AccordionTrigger className="p-3 bg-muted/50 rounded-md text-base">
                                    <span className="flex items-center gap-2"><Sparkles/> Your Personalized Salary Estimate</span>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 border rounded-b-md">
                                    <Alert>
                                        <AlertTitle className="text-xl font-bold text-primary">
                                            {salaryResult.estimatedSalaryRange}
                                        </AlertTitle>
                                        <AlertDescription>
                                            {salaryResult.commentary}
                                        </AlertDescription>
                                    </Alert>
                                </AccordionContent>
                            </AccordionItem>
                        )}
                        {intelResult && (
                            <>
                                <AccordionItem value="growth-path">
                                    <AccordionTrigger className="p-3 bg-muted/50 rounded-md text-base">
                                        <span className="flex items-center gap-2"><GitBranch/> Growth Path & Salary</span>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 border rounded-b-md">
                                        <ul className="list-none space-y-2">
                                            {intelResult.growthPath.map((step, i) => (
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
                                            {intelResult.skillsInDemand.map((skill, i) => <Badge key={i}>{skill}</Badge>)}
                                    </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="location-comparison">
                                    <AccordionTrigger className="p-3 bg-muted/50 rounded-md text-base">
                                        <span className="flex items-center gap-2"><Map/> Location Comparison</span>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 border rounded-b-md space-y-2">
                                    <p className="text-muted-foreground">{intelResult.locationComparison.commentary}</p>
                                    </AccordionContent>
                                </AccordionItem>
                                
                                <AccordionItem value="top-companies">
                                    <AccordionTrigger className="p-3 bg-muted/50 rounded-md text-base">
                                        <span className="flex items-center gap-2"><Building/> Top Companies Hiring</span>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 border rounded-b-md">
                                        <div className="flex flex-wrap gap-2">
                                            {intelResult.topCompaniesHiring.map((company, i) => <Badge variant="outline" key={i}>{company}</Badge>)}
                                    </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="alumni-insights">
                                    <AccordionTrigger className="p-3 bg-muted/50 rounded-md text-base">
                                        <span className="flex items-center gap-2"><Users/> Alumni Career Switches</span>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 border rounded-b-md space-y-2">
                                    <p><strong className="font-semibold">Average Tenure:</strong> {intelResult.alumniInsights.avgTenure}</p>
                                    <div>
                                        <strong className="font-semibold">Common Career Switches:</strong>
                                        <ul className="list-disc list-inside text-muted-foreground">
                                            {intelResult.alumniInsights.careerSwitches.map((step, i) => <li key={i}>{step}</li>)}
                                        </ul>
                                    </div>
                                    </AccordionContent>
                                </AccordionItem>
                                
                                <AccordionItem value="interview-prep">
                                    <AccordionTrigger className="p-3 bg-muted/50 rounded-md text-base">
                                        <span className="flex items-center gap-2"><BrainCircuit/> Interview Prep</span>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 border rounded-b-md space-y-2">
                                        <p><strong className="font-semibold">Difficulty:</strong> {intelResult.interviewPrep.difficultyRating}</p>
                                        <div>
                                        <strong className="font-semibold">Common Question Categories:</strong>
                                        <ul className="list-disc list-inside text-muted-foreground">
                                            {intelResult.interviewPrep.commonQuestionCategories.map((cat, i) => <li key={i}>{cat}</li>)}
                                        </ul>
                                    </div>
                                    </AccordionContent>
                                </AccordionItem>
                                
                                <AccordionItem value="application-strategy">
                                    <AccordionTrigger className="p-3 bg-muted/50 rounded-md text-base">
                                        <span className="flex items-center gap-2"><CheckCircle/> Application Strategy</span>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 border rounded-b-md space-y-2">
                                        <p><strong className="font-semibold">Best Time to Apply:</strong> {intelResult.applicationStrategy.bestTimeToApply}</p>
                                        <div>
                                        <strong className="font-semibold">Success Rates by Method:</strong>
                                        <ul className="list-none text-muted-foreground space-y-1 mt-1">
                                            {intelResult.applicationStrategy.successRates.map((rate, i) => (
                                                <li key={i} className="flex justify-between items-center">
                                                    <span>{rate.method}</span>
                                                    <span className="font-mono font-bold text-primary">{rate.probability}</span>
                                                    </li>
                                            ))}
                                        </ul>
                                    </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </>
                        )}
                    </Accordion>
                 </div>
             )}
        </div>
    )
}
