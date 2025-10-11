
import { Card } from "@/app/components/ui/Card";

export default function Page() {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
                <div className="text-sm text-muted-foreground">Total Cafés</div>
                <div className="mt-2 text-3xl font-semibold">128</div>
            </Card>
            <Card>
                <div className="text-sm text-muted-foreground">Active Users</div>
                <div className="mt-2 text-3xl font-semibold">12,409</div>
            </Card>
            <Card>
                <div className="text-sm text-muted-foreground">Monthly Check-ins</div>
                <div className="mt-2 text-3xl font-semibold">31,552</div>
            </Card>

            <Card className="md:col-span-2 min-h-[260px]">Recent Activity feed…</Card>
            <Card className="min-h-[260px]">Map / Heatmap placeholder…</Card>
        </div>
    );
}
