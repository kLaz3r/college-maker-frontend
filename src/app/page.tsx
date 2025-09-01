import { CollageMaker } from "~/components/collage-maker";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            Photo Collage Maker
          </h1>
          <p className="text-lg text-gray-600">
            Upload your images and create beautiful collages with customizable
            layouts
          </p>
        </div>
        <CollageMaker />
      </div>
    </main>
  );
}
