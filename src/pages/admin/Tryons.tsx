import React, { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTryonJob, listTryonJobs } from '@/api/genaiApi';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { AlertTriangle, Eye, Film, ImageIcon } from 'lucide-react';
import { getApiBaseUrl } from '@/config/api';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Select as AntSelect, Input as AntInput } from 'antd';

const CATEGORIES = ['product', 'model-tryon', 'lifestyle', 'banner'];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const b64 = result.split(',')[1] || '';
      resolve(b64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function TryonsAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [errorViewerOpen, setErrorViewerOpen] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [prompt, setPrompt] = useState('');
  const [savedCategories, setSavedCategories] = useState<string[]>([]);
  const [savedPrompts, setSavedPrompts] = useState<string[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  
  // Override dialog overlay to be darker for admin panel
  React.useEffect(() => {
    if (open) {
      const overlay = document.querySelector('[data-radix-dialog-overlay]');
      if (overlay) {
        (overlay as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      }
    }
  }, [open]);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['tryons', 'jobs'],
    queryFn: () => listTryonJobs(50),
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const medias = await Promise.all(
        files.map(async (f) => {
          const data = await fileToBase64(f);
          return { data, mimetype: f.type || 'application/octet-stream' };
        })
      );
      return createTryonJob({ category, prompt, medias });
    },
    onSuccess: () => {
      const trimmedCategory = category.trim();
      const trimmedPrompt = prompt.trim();
      if (trimmedCategory && !savedCategories.includes(trimmedCategory)) {
        setSavedCategories((prev) =>
          prev.includes(trimmedCategory) ? prev : [...prev, trimmedCategory]
        );
      }
      if (trimmedPrompt && !savedPrompts.includes(trimmedPrompt)) {
        setSavedPrompts((prev) =>
          prev.includes(trimmedPrompt) ? prev : [...prev, trimmedPrompt]
        );
      }
      setCategory(CATEGORIES[0]);
      setPrompt('');
      setFiles([]);
      setStep(1);
      setOpen(false);
      qc.invalidateQueries({ queryKey: ['tryons', 'jobs'] });
    },
  });

  const disabled = useMemo(() => createMut.isPending || files.length === 0, [createMut.isPending, files.length]);

  const selectedJob = useMemo(
    () => jobs?.find((j) => j.id === selectedJobId) ?? null,
    [jobs, selectedJobId]
  );

  const mediaBaseUrl = useMemo(() => `${getApiBaseUrl()}/genai/media`, []);

  React.useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem('genai_tryons_categories') || '[]');
      if (Array.isArray(c)) {
        setSavedCategories(c);
      }
      const p = JSON.parse(localStorage.getItem('genai_tryons_prompts') || '[]');
      if (Array.isArray(p)) {
        setSavedPrompts(p);
      }
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem('genai_tryons_categories', JSON.stringify(savedCategories));
    } catch {
      // ignore
    }
  }, [savedCategories]);

  React.useEffect(() => {
    try {
      localStorage.setItem('genai_tryons_prompts', JSON.stringify(savedPrompts));
    } catch {
      // ignore
    }
  }, [savedPrompts]);

  return (
    <div className="p-6 space-y-6 [&_[data-radix-dialog-content]]:bg-white [&_[data-radix-dialog-content]]:border-gray-200 [&_[data-radix-select-content]]:bg-white [&_[data-radix-select-content]]:border-gray-200">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">GenAI Tryons</h2>
        <div className="flex items-center gap-2">
          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) {
                setStep(1);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>Create Job</Button>
            </DialogTrigger>
            <DialogContent className="w-[98vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] max-w-4xl bg-white border-gray-200">
              <DialogHeader>
                <DialogTitle className="text-gray-900">New Tryon Job</DialogTitle>
              </DialogHeader>
              {step === 1 && (
                <div className="space-y-4 py-2 bg-white text-black">
                  <Card className="bg-white border border-gray-200 shadow-none">
                    <CardContent className="pt-4 space-y-3">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-gray-900">
                        Category
                      </Label>
                      <AntSelect
                        mode="tags"
                        style={{ width: '100%' }}
                        placeholder="Category (e.g. model-tryon)"
                        value={category ? [category] : []}
                        onChange={(values) => {
                          const last = values[values.length - 1] || '';
                          setCategory(last);
                          setSavedCategories(values);
                        }}
                        options={[...new Set([...CATEGORIES, ...savedCategories, category])]
                          .filter(Boolean)
                          .map((c) => ({ label: c, value: c }))}
                        size="middle"
                      />
                    </CardContent>
                  </Card>

                  <Card className="bg-white border border-gray-200 shadow-none">
                    <CardContent className="pt-4 space-y-3">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-gray-900">
                        Prompt
                      </Label>
                      <AntSelect
                        mode="tags"
                        style={{ width: '100%' }}
                        placeholder="Select or create a prompt"
                        value={prompt ? [prompt] : []}
                        onChange={(values) => {
                          const last = values[values.length - 1] || '';
                          setPrompt(last);
                          setSavedPrompts(values);
                        }}
                        options={[...new Set([...savedPrompts, prompt])]
                          .filter(Boolean)
                          .map((p) => ({ label: p.length > 80 ? `${p.slice(0, 80)}…` : p, value: p }))}
                        size="middle"
                      />
                      <AntInput.TextArea
                        className="text-sm mt-3"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the output you want"
                        rows={8}
                      />
                    </CardContent>
                  </Card>
                  <div className="flex justify-between pt-2">
                    <Button variant="ghost" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => setStep(2)}
                      disabled={!category.trim() || !prompt.trim()}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="grid gap-4 py-2">
                  <div className="grid gap-1 text-sm">
                    <span className="font-medium text-gray-900">Category</span>
                    <span className="text-black italic break-words">{category}</span>
                  </div>
                  <div className="grid gap-1 text-sm">
                    <span className="font-medium text-gray-900">Prompt</span>
                    <span className="text-black italic whitespace-pre-wrap break-words max-h-24 overflow-auto">
                      {prompt}
                    </span>
                  </div>
                  <div className="grid gap-2">
                    <Label>Medias</Label>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/mp4"
                      onChange={(e) => {
                        const list = e.target.files ? Array.from(e.target.files) : [];
                        if (!list.length) return;
                        setFiles((prev) => [...prev, ...list]);
                      }}
                    />
                    <div className="text-sm text-muted-foreground">
                      {files.length} file(s) selected
                    </div>
                    {files.length > 0 && (
                      <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-64 overflow-auto">
                        {files.map((f, idx) => {
                          const isImage = f.type.startsWith('image/');
                          const isVideo = f.type.startsWith('video/');
                          const url = URL.createObjectURL(f);
                          return (
                            <div key={idx} className="relative group rounded-md border bg-black/5 overflow-hidden">
                              <div className="aspect-video w-full bg-black/80 flex items-center justify-center">
                                {isImage && (
                                  <img
                                    src={url}
                                    alt={f.name}
                                    className="h-full w-full object-cover"
                                    onLoad={() => URL.revokeObjectURL(url)}
                                  />
                                )}
                                {isVideo && (
                                  <video
                                    src={url}
                                    className="h-full w-full object-cover"
                                    onLoadedMetadata={() => URL.revokeObjectURL(url)}
                                    muted
                                  />
                                )}
                                {!isImage && !isVideo && (
                                  <span className="text-[10px] text-white px-2 text-center">
                                    {f.type || 'file'}
                                  </span>
                                )}
                              </div>
                              <div className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1 text-[10px] text-white truncate">
                                {f.name}
                              </div>
                              <button
                                type="button"
                                className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] text-white opacity-90 hover:bg-black"
                                onClick={() =>
                                  setFiles((prev) => prev.filter((_, i) => i !== idx))
                                }
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                    >
                      Back
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => createMut.mutate()} disabled={disabled}>
                        {createMut.isPending ? 'Submitting...' : 'Start Processing'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Tryon Jobs</h2>
          </div>
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading jobs...</div>
          ) : !jobs?.length ? (
            <div className="text-center py-12 text-gray-500">No jobs yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prompt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Error
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.map((j) => (
                    <tr key={j.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {j.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xl">
                        <div
                          className={cn(
                            'leading-snug',
                            j.prompt ? 'line-clamp-2' : 'text-gray-400'
                          )}
                        >
                          {j.prompt || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {j.status}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {j.errorMsg ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => {
                              setErrorText(j.errorMsg || null);
                              setErrorViewerOpen(true);
                            }}
                            title="View error"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedJobId(j.id);
                            setViewerOpen(true);
                          }}
                          disabled={!j.medias || j.medias.length === 0}
                          title="View medias"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y">
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading jobs...</div>
          ) : !jobs?.length ? (
            <div className="p-4 text-sm text-muted-foreground">No jobs yet.</div>
          ) : (
            <div className="space-y-3 px-4 pb-4 pt-2">
              {jobs.map((j) => (
                <div key={j.id} className="border rounded-lg p-4 bg-white shadow-sm space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-gray-900">{j.category}</div>
                    <div className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                      {j.status}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'text-sm leading-snug text-gray-900',
                      j.prompt ? 'line-clamp-3' : 'text-gray-400'
                    )}
                  >
                    {j.prompt || '-'}
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div>
                      {j.errorMsg ? (
                        <button
                          className="inline-flex items-center gap-1 text-xs text-destructive"
                          onClick={() => {
                            setErrorText(j.errorMsg || null);
                            setErrorViewerOpen(true);
                          }}
                        >
                          <AlertTriangle className="h-3 w-3" />
                          <span>Error</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500">No error</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedJobId(j.id);
                          setViewerOpen(true);
                        }}
                        disabled={!j.medias || j.medias.length === 0}
                        title="View medias"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={errorViewerOpen} onOpenChange={setErrorViewerOpen}>
        <DialogContent className="w-[98vw] max-w-xl sm:w-auto bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Job Error
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 max-h-80 overflow-auto rounded-md border bg-muted/40 p-3 text-xs leading-relaxed whitespace-pre-wrap break-words">
            {errorText || 'No error information.'}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="w-[95vw] max-w-3xl sm:w-auto bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              Job #{selectedJob?.id} · {selectedJob?.category || '-'}
            </DialogTitle>
          </DialogHeader>
          {!selectedJob || !selectedJob.medias || selectedJob.medias.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No medias for this job.</div>
          ) : (
            <div className="relative">
              <Carousel className="w-full">
                <CarouselContent>
                  {selectedJob.medias.map((m) => {
                    const isImage = m.mimeType.startsWith('image/');
                    const isVideo = m.mimeType.startsWith('video/');
                    const sizeMb = m.sizeBytes ? (m.sizeBytes / (1024 * 1024)).toFixed(2) : '0';
                    let filePath = m.filePath || '';
                    const absPrefix = '/app/data/genai_tryons/';
                    if (filePath.startsWith(absPrefix)) {
                      filePath = filePath.slice(absPrefix.length);
                    } else if (filePath.startsWith('/')) {
                      filePath = filePath.replace(/^\/+/, '');
                    }
                    const fileName = filePath.split('/').pop();
                    const srcUrl = `${mediaBaseUrl}/${filePath}`;
                    return (
                      <CarouselItem key={m.id}>
                        <div className="relative w-full aspect-video overflow-hidden rounded-lg bg-black">
                          {isImage && (
                            <img
                              src={srcUrl}
                              alt={fileName}
                              className="h-full w-full object-contain"
                            />
                          )}
                          {isVideo && (
                            <video
                              className="h-full w-full object-contain"
                              controls
                              src={srcUrl}
                            />
                          )}
                          {!isImage && !isVideo && (
                            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                              Unsupported media type
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-xs text-white">
                            <div className="flex items-center gap-2">
                              {isImage && <ImageIcon className="h-4 w-4" />}
                              {isVideo && <Film className="h-4 w-4" />}
                              <span className="font-semibold truncate">{fileName}</span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-3 opacity-90">
                              <span>JobID: {m.jobID}</span>
                              <span>MIME: {m.mimeType}</span>
                              <span>Size: {sizeMb} MB</span>
                            </div>
                          </div>
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


