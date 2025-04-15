"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, History, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function Dashboard() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        // Check if the user is authenticated
        const checkUser = async () => {
            try {
                // First try to get the session
                const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

                if (sessionError) {
                    throw sessionError
                }

                if (sessionData?.session) {
                    console.log("Session found:", sessionData.session)
                    setUser(sessionData.session.user)
                    setLoading(false)
                    return
                }

                // If no session, try to get the user
                const { data: userData, error: userError } = await supabase.auth.getUser()

                if (userError) {
                    throw userError
                }

                if (userData?.user) {
                    console.log("User authenticated:", userData.user)
                    setUser(userData.user)
                } else {
                    console.log("No user found, redirecting to login")
                    window.location.href = "/login"
                }
            } catch (err: any) {
                console.error("Error checking authentication:", err)
                setError(err.message)
                window.location.href = "/login"
            } finally {
                setLoading(false)
            }
        }

        checkUser()

        // Set up auth state change listener
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Auth state changed:", event)

            if (event === "SIGNED_OUT") {
                window.location.href = "/login"
            } else if (event === "SIGNED_IN" && session) {
                setUser(session.user)
            }
        })

        // Clean up the listener when the component unmounts
        return () => {
            authListener.subscription.unsubscribe()
        }
    }, [])

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut()
            window.location.href = "/login"
        } catch (err: any) {
            console.error("Error signing out:", err)
            setError(err.message)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl">Error</CardTitle>
                        <CardDescription>There was a problem loading your dashboard</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-red-600">{error}</p>
                        <Button className="mt-4" onClick={() => (window.location.href = "/login")}>
                            Return to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl">Session Expired</CardTitle>
                        <CardDescription>Your session has expired or you are not logged in</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => (window.location.href = "/login")}>Log In</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen">
            <header className="px-4 lg:px-6 h-14 flex items-center border-b">
                <div className="flex items-center justify-center">
                    <span className="text-xl font-bold">VideoEval</span>
                </div>
                <nav className="ml-auto flex gap-4 sm:gap-6">
                    <Button variant="ghost" onClick={handleSignOut}>
                        Sign Out
                    </Button>
                </nav>
            </header>
            <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold mb-6">Welcome, {user.email}</h1>

                    <Tabs defaultValue="upload" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="upload">
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Video
                            </TabsTrigger>
                            <TabsTrigger value="history">
                                <History className="mr-2 h-4 w-4" />
                                Evaluation History
                            </TabsTrigger>
                            <TabsTrigger value="profile">
                                <User className="mr-2 h-4 w-4" />
                                Profile
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="upload" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Upload Presentation Video</CardTitle>
                                    <CardDescription>Upload your presentation video for evaluation</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <VideoUpload userId={user.id} />
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="history" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Evaluation History</CardTitle>
                                    <CardDescription>View your past video evaluations</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <EvaluationHistory userId={user.id} />
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="profile" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Profile</CardTitle>
                                    <CardDescription>Manage your account settings</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <p>
                                            <strong>Email:</strong> {user.email}
                                        </p>
                                        <p>
                                            <strong>User ID:</strong> {user.id}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    )
}

function VideoUpload({ userId }: { userId: string }) {
    const [uploading, setUploading] = useState(false)
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [videoTitle, setVideoTitle] = useState("")

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setVideoFile(e.target.files[0])
        }
    }

    const handleUpload = async () => {
        if (!videoFile || !videoTitle) return

        setUploading(true)
        try {
            // Upload to Supabase Storage
            const fileExt = videoFile.name.split(".").pop()
            const fileName = `${userId}/${Math.random().toString(36).substring(2)}.${fileExt}`

            const { data, error } = await supabase.storage.from("videos").upload(fileName, videoFile)



            if (error) throw error

            // Get the public URL
            const fileUrl = supabase.storage.from("videos").getPublicUrl(fileName)
            const publicUrl = fileUrl.data.publicUrl


            console.log("publicUrl", publicUrl)


            // Save video metadata to database
            const { error: dbError } = await supabase.from("videos").insert([
                {
                    user_id: userId,
                    title: videoTitle,
                    video_url: publicUrl,
                    status: "processing",
                },
            ])

            if (dbError) throw dbError

            // Trigger evaluation process (in a real app, this would be a server-side function)
            await simulateEvaluation(userId, publicUrl);

            setVideoFile(null)
            setVideoTitle("")
            // Send evaluation request to Python backend
            const pythonBackendUrl = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL;
            console.log("pythonBackendUrl", pythonBackendUrl)
            await fetch(`${pythonBackendUrl}/evaluate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                user_id: userId,
                video_url: publicUrl,
                title: videoTitle,
                video_id: data.path // This is the unique storage path
              }),
            });
            alert("Video uploaded successfully and is evaluating.")
        } catch (error: any) {
            alert(error.message)
        } finally {
            setUploading(false)
        }
    }

    // This is a mock function - in a real app, this would be a server-side process
    const simulateEvaluation = async (userId: string, videoUrl: string) => {
        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Generate random scores
        const presentationScore = Math.floor(Math.random() * 40) + 60 // 60-100
        const deliveryScore = Math.floor(Math.random() * 40) + 60
        const contentScore = Math.floor(Math.random() * 40) + 60
        const overallScore = Math.floor((presentationScore + deliveryScore + contentScore) / 3)

        // Update the database with evaluation results
        await supabase
            .from("videos")
            .update({
                status: "completed",
                presentation_score: presentationScore,
                delivery_score: deliveryScore,
                content_score: contentScore,
                overall_score: overallScore,
                evaluated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .eq("video_url", videoUrl)
    }

    return (
        <div className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="video-title">Video Title</Label>
                <Input
                    id="video-title"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="Enter a title for your video"
                />
            </div>

            <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="video">Upload Video</Label>
                <Input id="video" type="file" accept="video/*" onChange={handleFileChange} />
            </div>

            {videoFile && (
                <div className="text-sm">
                    Selected file: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                </div>
            )}

            <Button onClick={handleUpload} disabled={!videoFile || !videoTitle || uploading}>
                {uploading ? "Uploading..." : "Upload Video"}
            </Button>
        </div>
    )
}

function EvaluationHistory({ userId }: { userId: string }) {
    const [evaluations, setEvaluations] = useState<any[]>([])
    const [loading, setLoading] = useState(true);
    const [selectedEvaluation, setSelectedEvaluation] = useState<any | null>(null);

    useEffect(() => {
        const fetchEvaluations = async () => {
            try {
                const { data, error } = await supabase
                    .from("videos")
                    .select("*")
                    .eq("user_id", userId)
                    .order("created_at", { ascending: false })

                if (error) throw error

                setEvaluations(data || [])
            } catch (error: any) {
                console.error("Error fetching evaluations:", error.message)
            } finally {
                setLoading(false)
            }
        }

        fetchEvaluations()
    }, [userId])

    if (loading) {
        return <div>Loading your evaluation history...</div>
    }

    if (evaluations.length === 0) {
        return <div>You haven't uploaded any videos for evaluation yet.</div>
    }

    return (
        <div className="space-y-4">
            {evaluations.map((evaluation) => (
                <Dialog key={evaluation.id} onOpenChange={(open) => { if (!open) setSelectedEvaluation(null); }}>
                    <DialogTrigger asChild>
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                            <CardContent className="pt-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <h3 className="font-medium">{evaluation.title}</h3>
                                        <span
                                            className={`px-2 py-1 rounded text-xs ${evaluation.status === "completed"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-yellow-100 text-yellow-800"
                                                }`}
                                        >
                                            {evaluation.status === "completed" ? "Evaluated" : "Processing"}
                                        </span>
                                    </div>

                                    <p className="text-sm text-muted-foreground">
                                        Uploaded on {new Date(evaluation.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{evaluation.title}</DialogTitle>
                            <CardDescription>
                                Evaluation Details
                            </CardDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2 pb-4">
                            <div className="space-y-2">
                                <p>
                                    <strong>Uploaded On:</strong> {new Date(evaluation.created_at).toLocaleDateString()}
                                </p>
                                <p>
                                    <strong>Status:</strong> {evaluation.status === "completed" ? "Evaluated" : "Processing"}
                                </p>
                                {evaluation.status === "completed" && (
                                    <>
                                        <p>
                                          <strong>Results:</strong>{" "}
                                          <a 
                                            href={evaluation.results_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                          >
                                            Download Results (CSV)
                                          </a>
                                        </p>
                                    </>
                                )}
                            </div>
                            {evaluation.video_url && (
                                <div className="space-y-2">
                                    <p><strong>Video:</strong></p>
                                    <video controls width="100%" src={evaluation.video_url} />
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            ))}
        </div>
    )
}
