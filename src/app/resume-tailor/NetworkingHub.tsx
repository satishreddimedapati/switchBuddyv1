'use client';

import { useState, useTransition } from 'react';
import { useAuth } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Search, UserPlus, FileQuestion } from 'lucide-react';
import type { HrContact, NetworkingActivity } from '@/lib/types';
import { searchHrContacts, addHrContact } from '@/services/hr-contacts';
import { getNetworkingActivities } from '@/services/networking-activities';
import { useToast } from '@/hooks/use-toast';
import { HrContactCard } from './HrContactCard';
import { HrContactForm } from './HrContactForm';
import { Timeline } from './Timeline';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
    
    const generateLinkedInSearchUrl = (role: string) => {
        const query = encodeURIComponent(`${role} recruiter`);
        return `https://www.linkedin.com/search/results/people/?keywords=${query}`;
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

                    {!isSearching && searched && searchResults.length === 0 && (
                         <Alert>
                            <FileQuestion className="h-4 w-4" />
                            <AlertTitle>Smart Suggestion</AlertTitle>
                            <AlertDescription>
                                No contacts in your local database? Try expanding your search.
                                <a 
                                    href={generateLinkedInSearchUrl(searchTerm)} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="font-semibold text-primary underline ml-2"
                                >
                                    Search LinkedIn for &quot;{searchTerm}&quot; recruiters
                                </a>
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
