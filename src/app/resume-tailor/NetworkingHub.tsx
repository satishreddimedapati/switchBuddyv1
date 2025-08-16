'use client';

import { useState, useTransition } from 'react';
import { useAuth } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Search, UserPlus, FileQuestion, Briefcase } from 'lucide-react';
import type { HrContact, NetworkingActivity } from '@/lib/types';
import { searchHrContacts, addHrContact } from '@/services/hr-contacts';
import { getNetworkingActivities } from '@/services/networking-activities';
import { useToast } from '@/hooks/use-toast';
import { HrContactCard } from './HrContactCard';
import { HrContactForm } from './HrContactForm';
import { Timeline } from './Timeline';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export function NetworkingHub() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<HrContact[]>([]);
    const [isSearching, startSearchTransition] = useTransition();
    const [showAddForm, setShowAddForm] = useState(false);
    const [searched, setSearched] = useState(false);
    
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !searchTerm) return;
        
        startSearchTransition(async () => {
            setSearched(true);
            const results = await searchHrContacts(searchTerm, user.uid);
            setSearchResults(results);
            setShowAddForm(results.length === 0);
        });
    };

    const handleContactAdded = (newContact: HrContact) => {
        setSearchResults(prev => [newContact, ...prev]);
        setShowAddForm(false);
        setSearchTerm('');
    };
    
    const generateLinkedInPeopleSearchUrl = (role: string) => {
        const query = encodeURIComponent(`${role} recruiter`);
        return `https://www.linkedin.com/search/results/people/?keywords=${query}`;
    }

    const generateLinkedInJobSearchUrl = (keywords: string, options: { time?: string, location?: string } = {}) => {
        const url = new URL('https://www.linkedin.com/jobs/search/');
        url.searchParams.set('keywords', keywords);
        if (options.location) {
            url.searchParams.set('location', options.location);
        }
        if (options.time) {
            // f_TPR is the filter for time posted range
            // r86400 = last 24 hours, r604800 = last week, r2592000 = last month
            url.searchParams.set('f_TPR', options.time);
        }
        return url.toString();
    }


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            {/* Left side: Search and Results */}
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Find HR Contacts</CardTitle>
                        <CardDescription>Search for HR professionals by job role in your network.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input 
                                placeholder="e.g., Angular Developer" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Button type="submit" disabled={isSearching}>
                                {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
                                Search
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                
                <div className="space-y-4">
                    {isSearching && <Loader2 className="animate-spin mx-auto" />}
                    
                    {!isSearching && searched && searchResults.length === 0 && (
                         <div className="text-center py-10 border rounded-lg space-y-4">
                            <p className="text-muted-foreground">No HR contacts found for &quot;{searchTerm}&quot;.</p>
                            <Button onClick={() => setShowAddForm(true)}><UserPlus className="mr-2"/>Add a new contact</Button>
                         </div>
                    )}
                    
                    {!isSearching && searchResults.length > 0 && (
                        <div>
                             <h3 className="text-lg font-semibold mb-4">Search Results</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {searchResults.map(contact => (
                                    <HrContactCard key={contact.id} contact={contact} />
                                ))}
                            </div>
                             <div className="flex justify-center mt-4">
                                <Button variant="outline" onClick={() => setShowAddForm(true)}><UserPlus className="mr-2"/>Add another contact</Button>
                            </div>
                        </div>
                    )}
                    
                    {showAddForm && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Add New HR Contact</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <HrContactForm onContactAdded={handleContactAdded} initialJobRole={searchTerm} />
                            </CardContent>
                        </Card>
                    )}

                    {!isSearching && searched && searchTerm && (
                         <Alert>
                            <Briefcase className="h-4 w-4" />
                            <AlertTitle>Smart Search</AlertTitle>
                            <AlertDescription className="space-y-4">
                                <div className='space-y-2'>
                                    <p className="font-semibold">Find Recruiters</p>
                                    <p>No contacts in your local database? Try expanding your search on LinkedIn.</p>
                                    <a 
                                        href={generateLinkedInPeopleSearchUrl(searchTerm)} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="font-semibold text-primary underline"
                                    >
                                        Search LinkedIn for &quot;{searchTerm}&quot; recruiters
                                    </a>
                                </div>
                                <Separator />
                                <div className='space-y-2'>
                                     <p className="font-semibold">Find Jobs</p>
                                     <p>Use these quick links to find job postings.</p>
                                     <div className="flex flex-wrap gap-2">
                                        <Button asChild variant="link" className="p-0 h-auto">
                                            <a href={generateLinkedInJobSearchUrl(searchTerm, {time: 'r86400'})} target="_blank" rel="noopener noreferrer">Latest Posts</a>
                                        </Button>
                                        <Button asChild variant="link" className="p-0 h-auto">
                                            <a href={generateLinkedInJobSearchUrl(searchTerm, {location: 'Hyderabad, Telangana, India'})} target="_blank" rel="noopener noreferrer">in Hyderabad</a>
                                        </Button>
                                        <Button asChild variant="link" className="p-0 h-auto">
                                            <a href={generateLinkedInJobSearchUrl(searchTerm, {location: 'Bengaluru, Karnataka, India'})} target="_blank" rel="noopener noreferrer">in Bangalore</a>
                                        </Button>
                                     </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </div>

            {/* Right side: Timeline */}
            <div className="lg:col-span-1">
                <Timeline />
            </div>
        </div>
    );
}
