import { CardContent, CardHeader, CardTitle } from '../ui/card';
import { Edit, Trash } from 'lucide-react';
import { Button } from '../ui/button';

type RouteWithCities = {
  id: number;
  from: { name: string };
  to: { name: string };
  distance?: number | null;
  duration?: number | null;
};

type RoutesTabProps = {
  routes: RouteWithCities[];
  isPending: boolean;
  error: string | null;
  refreshRoutes: () => Promise<void>; // optional for actions like delete
};

export default function RoutesTab({ routes, isPending }: RoutesTabProps) {
  function handleEditRoute(id: number): void {
    throw new Error('Function not implemented.');
  }

  function handleDeleteRoute(id: number): void {
    throw new Error('Function not implemented.');
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Učitavanje ruta...</span>
      </div>
    );
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="text-xl">Putanje</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left">
                <th className="p-2">ID</th>
                <th className="p-2">Ruta</th>
                <th className="p-2">Distance (km)</th>
                <th className="p-2">Duration (min)</th>
                <th className="p-2">Kontrole</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.id}</td>
                  <td className="p-2">
                    {r.from.name} → {r.to.name}
                  </td>
                  <td className="p-2">{r.distance ?? '-'}</td>
                  <td className="p-2">{r.duration ?? '-'}</td>
                  <td className="p-2 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRoute(r.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteRoute(r.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </>
  );
}
