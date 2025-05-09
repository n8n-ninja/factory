import { ServiceCard } from "~/components/ServiceCard"

export interface Service {
  title: string
  description: string
}

export interface ServiceCategoryProps {
  title: string
  services: Service[]
}

export function ServiceCategory({ title, services }: ServiceCategoryProps) {
  return (
    <div className="mb-14">
      <h2 className="text-2xl mb-8 relative text-center">
        <span
          className={`relative z-10 inline-block pb-4 opacity-70 font-light bg-gradient-to-r  from-pink-500 to-purple-500 bg-clip-text text-transparent`}
        >
          {title}
        </span>
      </h2>

      <div className="flex flex-wrap justify-center gap-6">
        {services.map((service, index) => (
          <div key={index} className="w-[300px]">
            <ServiceCard
              key={index}
              title={service.title}
              description={service.description}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
