import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faArrowDown,
  faArrowUp,
  faDownload,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { PDFDocument } from 'pdf-lib';
import { createSignal, For, Show, type Component } from 'solid-js';

import { UtilityPage } from './UtilityPage';

type PdfQueueItem = {
  id: string;
  file: File;
};

let nextPdfId = 0;

const PdfMergePage: Component = () => {
  let fileInput: HTMLInputElement | undefined;
  let dragDepth = 0;

  const [files, setFiles] = createSignal<PdfQueueItem[]>([]);
  const [isDragging, setIsDragging] = createSignal(false);
  const [isMerging, setIsMerging] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const canMerge = () => files().length >= 2 && !isMerging();

  const addFiles = (fileList: FileList | File[]) => {
    const incomingFiles = Array.from(fileList);
    const pdfFiles = incomingFiles.filter(isPdfFile);
    const skippedCount = incomingFiles.length - pdfFiles.length;

    if (pdfFiles.length > 0) {
      setFiles((currentFiles) => [
        ...currentFiles,
        ...pdfFiles.map((file) => ({
          id: `${file.name}-${file.lastModified}-${nextPdfId++}`,
          file,
        })),
      ]);
    }

    setError(
      skippedCount > 0
        ? `${skippedCount} unsupported file${skippedCount === 1 ? '' : 's'} ignored. Please add PDF files only.`
        : null,
    );
  };

  const handleFileInput = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;

    if (input.files) {
      addFiles(input.files);
    }

    input.value = '';
  };

  const moveFile = (fromIndex: number, toIndex: number) => {
    setFiles((currentFiles) => {
      if (toIndex < 0 || toIndex >= currentFiles.length) {
        return currentFiles;
      }

      const updatedFiles = [...currentFiles];
      const [movedFile] = updatedFiles.splice(fromIndex, 1);
      updatedFiles.splice(toIndex, 0, movedFile);
      return updatedFiles;
    });
  };

  const removeFile = (id: string) => {
    setFiles((currentFiles) => currentFiles.filter((item) => item.id !== id));
  };

  const handleDragEnter = (event: DragEvent) => {
    preventDragDefaults(event);
    dragDepth += 1;

    if (hasDraggedFiles(event)) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (event: DragEvent) => {
    preventDragDefaults(event);

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }

    if (hasDraggedFiles(event)) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: DragEvent) => {
    preventDragDefaults(event);
    dragDepth = Math.max(0, dragDepth - 1);

    if (dragDepth === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event: DragEvent) => {
    preventDragDefaults(event);
    dragDepth = 0;
    setIsDragging(false);

    if (event.dataTransfer?.files) {
      addFiles(event.dataTransfer.files);
    }
  };

  const mergeFiles = async () => {
    if (!canMerge()) {
      setError('Add at least two PDF files before merging.');
      return;
    }

    setIsMerging(true);
    setError(null);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of files()) {
        const sourceBytes = await item.file.arrayBuffer();
        const sourcePdf = await PDFDocument.load(sourceBytes);
        const copiedPages = await mergedPdf.copyPages(
          sourcePdf,
          sourcePdf.getPageIndices(),
        );

        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();
      downloadMergedPdf(mergedBytes);
    } catch (mergeError) {
      console.error(mergeError);
      setError(
        'Unable to merge these PDFs. One may be encrypted, corrupt, or unsupported.',
      );
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <UtilityPage
      title="PDF Merge"
      eyebrow="Document utility"
      accent="blue"
      description="Select, order, and merge PDF files directly in your browser. Your files never leave your device."
    >
      <div class="space-y-6">
        <section
          class="glass-panel p-4 text-center"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div
            class={`rounded-[1.5rem] border-dashed px-6 py-10 transition duration-200 sm:py-12 ${isDragging() ? 'border-4 border-white bg-white/10 shadow-[inset_0_0_36px_rgba(255,255,255,0.12)]' : 'border-2 border-sky-300/35 bg-white/[0.03]'}`}
          >
            <input
              ref={fileInput}
              class="sr-only"
              type="file"
              accept="application/pdf,.pdf"
              multiple
              onChange={handleFileInput}
            />
            <p
              class={`text-sm font-semibold uppercase tracking-[0.35em] transition ${isDragging() ? 'text-white' : 'text-sky-200/70'}`}
            >
              {isDragging() ? 'Release to add PDFs' : 'Drop PDFs here'}
            </p>
            <button
              class="primary-button mt-6 gap-2"
              type="button"
              onClick={() => fileInput?.click()}
            >
              Choose PDF files
            </button>
          </div>
        </section>

        <Show when={error()}>
          <p class="rounded-2xl border border-rose-300/30 bg-rose-500/10 px-5 py-4 text-sm font-medium text-rose-100">
            {error()}
          </p>
        </Show>

        <section class="glass-panel p-6">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="mt-2 text-2xl font-bold text-white">
                {files().length} file{files().length === 1 ? '' : 's'} selected
              </h2>
            </div>
            <button
              class="primary-button gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              disabled={!canMerge()}
              onClick={mergeFiles}
            >
              <FaIcon icon={faDownload} />
              {isMerging() ? 'Merging...' : 'Merge and download'}
            </button>
          </div>

          <Show
            when={files().length > 0}
            fallback={
              <p class="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-300">
                No PDFs selected yet.
              </p>
            }
          >
            <ol class="mt-6 space-y-3">
              <For each={files()}>
                {(item, index) => (
                  <li class="glass-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div class="min-w-0">
                      <p class="truncate text-lg font-semibold text-white">
                        {index() + 1}. {item.file.name}
                      </p>
                      <p class="mt-1 text-sm text-slate-400">
                        {formatBytes(item.file.size)}
                      </p>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <button
                        class="secondary-button min-h-0 gap-2 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                        type="button"
                        disabled={index() === 0 || isMerging()}
                        onClick={() => moveFile(index(), index() - 1)}
                      >
                        <FaIcon icon={faArrowUp} />
                      </button>
                      <button
                        class="secondary-button min-h-0 gap-2 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                        type="button"
                        disabled={index() === files().length - 1 || isMerging()}
                        onClick={() => moveFile(index(), index() + 1)}
                      >
                        <FaIcon icon={faArrowDown} />
                      </button>
                      <button
                        class="secondary-button min-h-0 gap-2 border-rose-300/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                        type="button"
                        disabled={isMerging()}
                        onClick={() => removeFile(item.id)}
                      >
                        <FaIcon icon={faTrashCan} />
                      </button>
                    </div>
                  </li>
                )}
              </For>
            </ol>
          </Show>
        </section>
      </div>
    </UtilityPage>
  );
};

const isPdfFile = (file: File) => {
  return (
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  );
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** unitIndex;

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const preventDragDefaults = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

const hasDraggedFiles = (event: DragEvent) => {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files');
};

const FaIcon: Component<{ icon: IconDefinition; class?: string }> = (props) => {
  const [width, height, , , pathData] = props.icon.icon;
  const paths = Array.isArray(pathData) ? pathData : [pathData];

  return (
    <svg
      aria-hidden="true"
      class={`h-4 w-4 shrink-0 ${props.class ?? ''}`}
      viewBox={`0 0 ${width} ${height}`}
    >
      <For each={paths}>{(path) => <path fill="currentColor" d={path} />}</For>
    </svg>
  );
};

const downloadMergedPdf = (bytes: Uint8Array) => {
  const pdfBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(pdfBuffer).set(bytes);

  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'merged.pdf';
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default PdfMergePage;
