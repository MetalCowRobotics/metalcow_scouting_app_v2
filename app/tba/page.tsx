import TBAExplorer from '@/components/tba/TBAExplorer'

export default function TBAPage() {
    return (
        <div className="container py-8 mx-auto px-4">
            <div className="mb-8">
                <h1 className="text-4xl font-extrabold tracking-tight mb-2">TBA Data Discovery</h1>
                <p className="text-muted-foreground">Browse official competition data directly from The Blue Alliance API.</p>
            </div>
            <TBAExplorer />
        </div>
    )
}
