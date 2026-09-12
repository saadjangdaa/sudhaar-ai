// TODO: build by [Saad] — citizen report form (core loop).
//
// Wiring already in place, do not rebuild it:
//   uploadMedia(file)   src/lib/supabase/client.ts  -> returns a public URL
//   submitReport(body)  src/lib/api.ts              -> POST /api/report
//   warmBackend()       src/lib/api.ts              -> call on mount, Render sleeps
//   AREAS, AREA_LABELS  src/lib/types.ts            -> datalist options
//
// Flow: photo/voice/text + area + language -> upload -> submit -> <ResultCard/>

export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Sudhaar AI</h1>
      <p className="mt-2 text-sm text-gray-600">
        Report a civic issue in Karachi. Photo, voice note, or a few words.
      </p>
      <p className="mt-8 rounded border border-dashed border-gray-300 p-4 text-sm text-gray-500">
        Report form goes here.
      </p>
    </main>
  );
}
