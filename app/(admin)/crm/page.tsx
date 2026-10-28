export default function CRMPage() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-[#f4511e]">
            Maitri Global Education
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
            CRM
          </h1>

          <p className="mt-2 text-sm text-zinc-500 sm:text-base">
            Manage contact enquiries, event registrations, and scholarship
            applications.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Contact Enquiries",
              description: "View and manage website contact submissions.",
              href: "/crm/contacts",
            },
            {
              title: "Event Registrations",
              description: "Manage registrations for published events.",
              href: "/crm/event-registrations",
            },
            {
              title: "Scholarship Applications",
              description: "Review incoming scholarship applications.",
              href: "/crm/scholarship-applications",
            },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
            >
              <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-orange-50 text-[#f4511e] transition-colors group-hover:bg-[#f4511e] group-hover:text-white">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="size-5"
                  aria-hidden="true"
                >
                  <path
                    d="M4 5.5h16v13H4z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m4.5 7 7.5 6 7.5-6"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h2 className="text-lg font-semibold text-zinc-900">
                {item.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                {item.description}
              </p>

              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#f4511e]">
                View records
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
