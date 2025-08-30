
'use client';

export default function BudgetTrackerPage() {
    return (
        <div className="flex flex-col h-full gap-4">
            <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">
                    Budget Tracker
                </h1>
                <p className="text-muted-foreground">
                    Your personal finance dashboard, embedded right here.
                </p>
            </div>
            <div className="flex-grow rounded-lg overflow-hidden border">
                <iframe
                    src="https://satish-budget-tracker.vercel.app"
                    className="w-full h-full border-0"
                    title="Budget Tracker Application"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                ></iframe>
            </div>
        </div>
    );
}
