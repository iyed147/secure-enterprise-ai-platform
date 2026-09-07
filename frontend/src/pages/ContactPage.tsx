import Navbar from "../components/layout/Navbar";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-900">
          Contact us
        </h1>

        <p className="mb-8 text-slate-600">
          Une question sur la plateforme ? Écrivez-nous, notre équipe vous
          répondra rapidement.
        </p>

        <a
          href="mailto:contact@vaultmind.local"
          className="inline-block rounded-full bg-primary px-7 py-3.5 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-primary-hover"
        >
          contact@vaultmind.local
        </a>
      </main>
    </div>
  );
}