"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Save, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { AboutPageContent } from "@/lib/types";
import { DEFAULT_ABOUT_CONTENT } from "@/lib/mock-data";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400";

/**
 * Admin-only editor for the public /about page content — Company Overview,
 * Mission, Vision, Core Values, Why Choose Us, Areas We Operate, Services
 * Offered, Testimonials, and the Founder section. Backed by
 * GET/PUT /api/v1/site-content/about (see backend/internal/handlers/
 * site_content_handler.go), so editors never need a code deploy to update
 * this copy.
 */
export default function AdminContentPage() {
  const [content, setContent] = useState<AboutPageContent | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    api.siteContent
      .getAbout()
      .then((c) => {
        setContent(c);
        setStatus("idle");
      })
      .catch(() => {
        setContent(DEFAULT_ABOUT_CONTENT);
        setStatus("idle");
      });
  }, []);

  async function handleSave() {
    if (!content) return;
    setStatus("saving");
    setError("");
    try {
      const saved = await api.siteContent.updateAbout(content);
      setContent(saved);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not save — is the API running?");
    }
  }

  if (!content) return <p className="text-white/50">Loading About page content...</p>;

  function update<K extends keyof AboutPageContent>(key: K, value: AboutPageContent[K]) {
    setContent((c) => (c ? { ...c, [key]: value } : c));
  }

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Edit About Page</h1>
          <p className="mt-1 text-white/50">
            Changes here update the public <code className="text-teal-300">/about</code> page immediately.
          </p>
        </div>
        <motion.button
          onClick={handleSave}
          disabled={status === "saving"}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 rounded-full bg-teal-gradient px-5 py-2.5 text-sm font-semibold text-charcoal-950 disabled:opacity-50"
        >
          <Save size={15} />
          {status === "saving" ? "Saving..." : status === "saved" ? "Saved!" : "Save Changes"}
        </motion.button>
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="mt-8 space-y-8">
        <Field label="Company Overview">
          <textarea
            rows={4}
            value={content.overview}
            onChange={(e) => update("overview", e.target.value)}
            className={`${inputClass} resize-none`}
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Mission">
            <textarea
              rows={3}
              value={content.mission}
              onChange={(e) => update("mission", e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </Field>
          <Field label="Vision">
            <textarea
              rows={3}
              value={content.vision}
              onChange={(e) => update("vision", e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </Field>
        </div>

        <ObjectListEditor
          title="Core Values"
          items={content.core_values}
          onChange={(items) => update("core_values", items)}
          fields={["title", "description"]}
          emptyItem={{ title: "", description: "" }}
        />

        <StringListEditor
          title="Why Choose TheVHomes"
          items={content.why_choose_us}
          onChange={(items) => update("why_choose_us", items)}
        />
        <StringListEditor
          title="Areas We Operate"
          items={content.areas_we_operate}
          onChange={(items) => update("areas_we_operate", items)}
        />
        <StringListEditor
          title="Services Offered"
          items={content.services_offered}
          onChange={(items) => update("services_offered", items)}
        />

        <ObjectListEditor
          title="Testimonials"
          items={content.testimonials}
          onChange={(items) => update("testimonials", items)}
          fields={["name", "role", "quote"]}
          emptyItem={{ name: "", role: "", quote: "" }}
        />

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="font-display text-base font-semibold text-white">Founder Section</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name / Title Line 1">
              <input
                value={content.founder.name}
                onChange={(e) => update("founder", { ...content.founder, name: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Title Line 2">
              <input
                value={content.founder.title}
                onChange={(e) => update("founder", { ...content.founder, title: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Biography">
            <textarea
              rows={3}
              value={content.founder.bio}
              onChange={(e) => update("founder", { ...content.founder, bio: e.target.value })}
              className={`${inputClass} resize-none`}
            />
          </Field>
          <Field label="Leadership Message (quote)">
            <textarea
              rows={2}
              value={content.founder.message}
              onChange={(e) => update("founder", { ...content.founder, message: e.target.value })}
              className={`${inputClass} resize-none`}
            />
          </Field>
          <Field label="Vision for TheVHomes">
            <textarea
              rows={2}
              value={content.founder.vision}
              onChange={(e) => update("founder", { ...content.founder, vision: e.target.value })}
              className={`${inputClass} resize-none`}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 first:mt-0">
      <label className="text-xs font-medium text-white/50">{label}</label>
      {children}
    </div>
  );
}

function StringListEditor({
  title,
  items,
  onChange,
}: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-white">{title}</h3>
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:border-teal-400/40"
        >
          <Plus size={13} /> Add
        </button>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              className={inputClass + " mt-0"}
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="shrink-0 text-white/40 hover:text-red-400"
              aria-label="Remove item"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ObjectListEditor<T extends Record<string, string>>({
  title,
  items,
  onChange,
  fields,
  emptyItem,
}: {
  title: string;
  items: T[];
  onChange: (items: T[]) => void;
  fields: (keyof T)[];
  emptyItem: T;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-white">{title}</h3>
        <button
          type="button"
          onClick={() => onChange([...items, emptyItem])}
          className="flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:border-teal-400/40"
        >
          <Plus size={13} /> Add
        </button>
      </div>
      <div className="mt-3 space-y-4">
        {items.map((item, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                className="text-white/40 hover:text-red-400"
                aria-label="Remove item"
              >
                <Trash2 size={14} />
              </button>
            </div>
            {fields.map((field) => (
              <div key={String(field)} className="mt-1">
                <label className="text-[11px] uppercase tracking-wide text-white/40">{String(field)}</label>
                <input
                  value={item[field]}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = { ...next[i], [field]: e.target.value };
                    onChange(next);
                  }}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
