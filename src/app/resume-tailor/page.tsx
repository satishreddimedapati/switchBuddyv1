import { AppLayout } from "@/components/AppLayout";
import { ResumeTailorForm } from "./ResumeTailorForm";

export default function ResumeTailorPage() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            AI Resume Tailor
          </h1>
          <p className="text-muted-foreground">
            Optimize your resume for any job description with the power of AI.
          </p>
        </div>
        <ResumeTailorForm />
      </div>
    </AppLayout>
  );
}
