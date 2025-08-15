import { AppLayout } from "@/components/AppLayout";
import { InterviewPrepForm } from "./InterviewPrepForm";

export default function InterviewPrepPage() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            AI Interview Prep
          </h1>
          <p className="text-muted-foreground">
            Generate potential interview questions based on a job description.
          </p>
        </div>
        <InterviewPrepForm />
      </div>
    </AppLayout>
  );
}
