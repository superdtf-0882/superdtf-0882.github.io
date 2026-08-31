export const metadata = {
  title: 'Not found — David Facer',
};

export default function NotFound() {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body { background: radial-gradient(ellipse 80% 60% at 50% 35%, #11141A 0%, #07080B 100%); }
            `,
          }}
        />
      </head>
      <body className="font-sans min-h-screen flex items-center justify-center text-[#C9CDD3]">
        <div className="text-center px-6">
          <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#868C97] mb-4">404</p>
          <h1 className="text-2xl text-[#ECEEF1] mb-6">Page not found</h1>
          <a
            href="/"
            className="text-sm text-[#868C97] hover:text-[#B8924A] transition-colors duration-200"
          >
            ← Home
          </a>
        </div>
      </body>
    </html>
  );
}
