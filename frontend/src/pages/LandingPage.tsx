import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6 animate-fade-in">
          🔒 Enterprise-grade security
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
          Welcome to{" "}
          <span className="text-primary">Secure Enterprise AI</span>
        </h1>

        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Une plateforme interne qui combine authentification biométrique et intelligence
          artificielle pour donner à chaque employé un accès sécurisé et personnalisé
          aux connaissances de l'entreprise — sans jamais dépasser ses permissions.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            to="/register"
            className="bg-primary text-white font-semibold px-6 py-3 rounded-md hover:bg-primary-hover transition-all hover:scale-105 shadow-elevated"
          >
            Get started
          </Link>
          <Link
            to="/login"
            className="bg-white text-slate-900 font-semibold px-6 py-3 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Login
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left">
          <Feature
            icon="🧠"
            title="AI Knowledge Assistant"
            description="Posez vos questions et obtenez des réponses sourcées, basées uniquement sur vos documents autorisés."
          />
          <Feature
            icon="🛡️"
            title="Sécurité par conception"
            description="Chaque document reste strictement privé à son propriétaire — aucun accès croisé, aucune fuite."
          />
          <Feature
            icon="👤"
            title="Face ID intégré"
            description="Connectez-vous en toute sécurité grâce à la reconnaissance faciale, en plus du mot de passe classique."
          />
        </div>
      </main>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-card hover:shadow-elevated transition-shadow">
      <div className="text-2xl mb-3">{icon}</div>
      <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}