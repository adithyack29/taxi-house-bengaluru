import { Header } from "@/components/ui/navbar";
import { Button_Liquid, Button_Metal } from "@/components/ui/liquid-glass-button";

export default function DemoOne() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto space-y-12 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-900">
              New Design Integration
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              This demo showcases the new Liquid Glass Navbar and Buttons integrated into the TaxiHouse project.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 p-8 bg-white rounded-3xl border shadow-sm">
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Liquid Variant</p>
              <Button_Liquid size="xl">
                Get Started
              </Button_Liquid>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Metal Variant (Gold)</p>
              <Button_Metal variant="gold">
                Premium Ride
              </Button_Metal>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Metal Variant (Bronze)</p>
              <Button_Metal variant="bronze">
                Standard Ride
              </Button_Metal>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="p-8 bg-white rounded-3xl border shadow-sm space-y-4">
              <h3 className="text-xl font-bold">Responsive Glass Navbar</h3>
              <p className="text-slate-600">
                The navbar features a dynamic glass effect that activates on scroll, shrinking the width for a more modern, focused look on desktop.
              </p>
            </div>
            <div className="p-8 bg-white rounded-3xl border shadow-sm space-y-4">
              <h3 className="text-xl font-bold">Custom Metal Buttons</h3>
              <p className="text-slate-600">
                Highly interactive buttons with 3D metal effects, realistic shadows, and shine animations.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
