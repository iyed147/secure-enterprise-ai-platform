import Navbar from "../components/layout/Navbar";
export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-6 py-24 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Contact us
        </h1>

        <p className="text-slate-600 mb-8">
          Une question sur la plateforme ? Écrivez-nous, notre équipe vous
          répondra rapidement.
        </p>

        <a
          href="mailto:contact@secure-enterprise-ai.local"
          className="inline-block bg-primary text-white font-semibold px-6 py-3 rounded-md hover:bg-primary-hover transition-colors"
        >
          contact@secure-enterprise-ai.local
        </a>
      </main>
    </div>
  );
}