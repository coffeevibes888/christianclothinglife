const AboutPage = () => {
  const photos = [
    { id: 1, label: 'Founder', src: '/images/allenPic2.jpg' },
    { id: 2, label: 'Me', src: '/images/me2.PNG' },
  ];

  return (
    <main className="w-full min-h-screen py-10">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <header className="space-y-2 mb-10 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-violet-300">About</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-[0_0_35px_rgba(139,92,246,0.4)]">
            Rocken My Vibe
          </h1>
          <p className="max-w-2xl mx-auto text-sm md:text-base text-gray-200/90">
            Faith, humor, and real-life stories stitched into every design. This is where the heart behind
            Rocken My Vibe lives.
          </p>
        </header>

        <section className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)] items-start">
          <div className="space-y-6">
            <div className="rounded-3xl border border-violet-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950/70 p-6 md:p-8 shadow-[0_0_60px_rgba(124,58,237,0.35)]">
              <p className="text-xs font-semibold tracking-[0.2em] text-violet-200 uppercase mb-2">The Story</p>
              <p className="text-sm md:text-base text-gray-100 leading-relaxed">
                Hey, I&apos;m Allen — the creator, designer, and soul behind Rocken My Vibe. I didn&apos;t start this brand from a
                perfect place… actually, it came from surviving some of the hardest chapters of my life. From near-death
                experiences to spiritual awakenings, from rebuilding my faith to rebuilding my confidence — every step
                shaped who I am and what this brand stands for.
              </p>
              <p className="mt-4 text-sm md:text-base text-gray-200 leading-relaxed">
                I&apos;m a person who lives in two worlds at once: the spiritual one that speaks in signs, visions, and
                synchronicities… and the everyday physical world where bills, jobs, and real-life struggles don&apos;t
                magically disappear. Rocken My Vibe is the bridge I built between those worlds.
              </p>
              <p className="mt-4 text-sm md:text-base text-gray-200 leading-relaxed">
                After years of feeling like I didn&apos;t fit in, I realized something powerful: your vibe isn&apos;t supposed to
                match the room — it&apos;s supposed to shift it. So I turned my experiences, my connection with God, my sense
                of humor, and even my scars into something creative. I stopped hiding, stopped playing small, and decided
                to design clothes that carry a message — sometimes bold, sometimes funny, sometimes spiritual, but always
                real.
              </p>
              <p className="mt-4 text-sm md:text-base text-gray-200 leading-relaxed">
                This brand is for the people who&apos;ve been through things… the ones who feel energy deeply, who&apos;ve survived
                storms, who&apos;ve seen darkness but still choose light. It&apos;s for anyone who&apos;s ever felt &quot;different&quot; in the
                best (and hardest) ways. Rocken My Vibe is my reminder — and yours — that faith can be stylish, healing
                can be loud, and your story is worth wearing.
              </p>
              <p className="mt-4 text-sm md:text-base text-gray-200 leading-relaxed">
                If you&apos;re here, welcome. Whether you came for the graphics, the message, or just curiosity — I&apos;m glad
                you&apos;re part of this journey. Let&apos;s walk it together. With courage. With humor. With God. And most
                importantly… let&apos;s rock our vibe.
              </p>
            </div>
          </div>

          <div className="relative h-[420px] md:h-[480px] lg:h-[520px]">
            <div className="absolute inset-0 bg-gradient-radial from-violet-500/35 via-transparent to-transparent blur-3xl opacity-80" />

            <div className="relative h-full flex items-center justify-center">
              <div className="relative w-full max-w-md aspect-[4/5]">
                {/* Base card */}
                <div className="absolute inset-0 rounded-3xl border border-white/10 bg-slate-950/80 shadow-[0_0_45px_rgba(15,23,42,0.9)]" />

                {/* Floating photos */}
                <div className="group/pile absolute inset-0">
                  {photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className={`absolute rounded-2xl border border-white/15 overflow-hidden bg-slate-900/80 shadow-[0_18px_45px_rgba(15,23,42,0.85)] transition-all duration-300 ease-out cursor-pointer
                        hover:z-30 hover:scale-105 hover:-translate-y-2
                        group-hover/pile:opacity-70 hover:!opacity-100
                      `}
                      style={{
                        top: `${10 + index * 6}%`,
                        left: `${index % 2 === 0 ? 4 + index * 10 : 22 + index * 8}%`,
                        width: index === 1 || index === 2 ? '56%' : '48%',
                        height: index === 1 ? '52%' : index === 2 ? '50%' : '44%',
                        transform: `rotate(${index % 2 === 0 ? -6 + index * 2 : 8 - index * 2}deg)`,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.src}
                        alt={photo.label}
                        className="h-full w-full object-cover" 
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2 pt-4 text-[11px] text-gray-100 flex items-center justify-between">
                        <span className="uppercase tracking-[0.15em] text-gray-300">{photo.label}</span>
                        <span className="text-[10px] text-violet-300">Rocken My Vibe</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AboutPage;
