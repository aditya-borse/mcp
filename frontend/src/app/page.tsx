'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Download, FileText, Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface FileNode {
  path: string;
}

export default function HomePage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [zipFile, setZipFile] = useState<File | null>(null);

  const API_BASE_URL = 'http://localhost:8000';

  const handleUpload = async () => {
    if (!zipFile) {
      alert('Please select a .zip file to upload.');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', zipFile);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();

      setSessionId(data.session_id);
      setFileTree(data.file_tree || []);
      setMessage(data.message || 'Project uploaded successfully! You can now start editing files with natural language commands.');
    } catch (error) {
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionId || !prompt.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/prompt/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.statusText}`);
      }

      const data = await response.json();

      setFileTree(data.file_tree || []);
      setMessage(data.message || 'Your request has been processed successfully!');
    } catch (error) {
      alert(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      setPrompt('');
    }
  };

  const handleDownload = () => {
    if (!sessionId) return;
    window.location.href = `${API_BASE_URL}/download/${sessionId}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <ThemeToggle />
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text-display">
            File Editing Agent
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          <div className="lg:col-span-5">
            <Card className="h-full border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader className="border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Project Workspace</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {!sessionId ? (
                  <div className="space-y-6">
                    <div className="text-center p-8 border-2 border-dashed border-border rounded-xl bg-muted/30 transition-all-smooth hover:bg-muted/50">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Upload Your Project</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Drop a ZIP file containing your project files to get started
                      </p>
                      <Input
                        type="file"
                        accept=".zip"
                        onChange={(e) => setZipFile(e.target.files ? e.target.files[0] : null)}
                        className="mb-4 cursor-pointer transition-all-smooth hover:border-primary/50 focus:border-primary"
                      />
                      <Button
                        onClick={handleUpload}
                        disabled={isLoading || !zipFile}
                        className="w-full transition-all-smooth"
                        size="lg"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Project
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">Project Loaded Successfully</p>
                        <p className="text-xs text-muted-foreground">{fileTree.length} files detected</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Project Files
                      </h4>
                      <ScrollArea className="h-64 border border-border/50 rounded-lg bg-background/50">
                        <div className="p-4 space-y-1">
                          {fileTree.length > 0 ? (
                            fileTree.map((file, index) => (
                              <div
                                key={file.path}
                                className="font-mono text-xs p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-all-smooth border border-transparent hover:border-border/50"
                              >
                                {file.path}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No files found in workspace</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>

                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      className="w-full transition-all-smooth"
                      size="lg"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Modified Project
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7">
            <Card className="h-full border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader className="border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold">AI Assistant</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 flex flex-col h-[500px]">

                <div className="flex-1 mb-6">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">Assistant Response</h4>
                  <ScrollArea className="h-full border border-border/50 rounded-lg bg-background/50">
                    <div className="p-4">
                      {!sessionId ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
                          <p className="text-sm mb-2">Upload a project to start</p>
                          <p className="text-xs opacity-70">Once uploaded, you can ask the AI to edit, create, or delete files using natural language</p>
                        </div>
                      ) : message ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                            <p className="text-sm text-body whitespace-pre-wrap">{message}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">Ready to help! Send a message to get started.</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                <div className="space-y-4">
                  <form onSubmit={handlePromptSubmit} className="space-y-4">
                    <div>
                      <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={!sessionId || isLoading}
                        placeholder={!sessionId
                          ? 'Upload a project to enable AI assistance...'
                          : 'Try: "Add a README.md file", "Delete server.log file", or "Rename hello.txt to hello.md"'
                        }
                        className="min-h-[100px] resize-none transition-all-smooth hover:border-primary/50 focus:border-primary bg-background/80"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={!sessionId || isLoading || !prompt.trim()}
                      className="w-full transition-all-smooth"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>

                  {!sessionId && (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        Upload a project ZIP file to enable AI-powered file editing
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="text-center mt-12 pt-8 border-t border-border/30">
          <p className="text-sm text-muted-foreground">
            Built by{' '}
            <a
              href="https://github.com/aditya-borse"
              className="text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
            >
              Aditya Borse
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}